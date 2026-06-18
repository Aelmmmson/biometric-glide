import cv2
import numpy as np
import base64
from skimage.metrics import structural_similarity as ssim

class SignatureProcessor:
    def __init__(self):
        # Strict forensic threshold
        self.match_threshold = 82.0

    def decode_base64(self, data):
        """Standardizes base64 input and decodes it."""
        if 'base64,' in data:
            data = data.split('base64,')[1]
        img_bytes = base64.b64decode(data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img

    def preprocess(self, img):
        """
        Forensic-grade preprocessing:
        1. Grayscale
        2. Bilateral filter to preserve ink edges
        3. Adaptive thresholding — isolates ink from patterned cheque paper (GCB houndstooth, etc.)
        4. Morphological closing to bridge small gaps within ink strokes
        5. Connected component noise removal (drops artifacts < 10px area)
        6. Content-aware crop + normalize to 300x300
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)

        binary = cv2.adaptiveThreshold(
            filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 15, 4
        )

        kernel = np.ones((2, 2), np.uint8)
        closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

        # Remove noise specks
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(closed, connectivity=8)
        cleaned = np.zeros_like(closed)
        for i in range(1, num_labels):
            if stats[i, cv2.CC_STAT_AREA] >= 10:
                cleaned[labels == i] = 255

        # Content-aware crop
        coords = cv2.findNonZero(cleaned)
        if coords is not None:
            x, y, w, h = cv2.boundingRect(coords)
            pad = 8
            x = max(0, x - pad)
            y = max(0, y - pad)
            w = min(cleaned.shape[1] - x, w + 2 * pad)
            h = min(cleaned.shape[0] - y, h + 2 * pad)
            cleaned = cleaned[y:y+h, x:x+w]

        return cv2.resize(cleaned, (300, 300))

    def _score_ssim(self, p1, p2):
        """
        SSIM structural comparison.

        CRITICAL FIX: The old formula `(ssim + 1) / 2` mapped an uncorrelated
        score of 0.0 to 50%, and a score of -0.05 to 47.5% — meaning two random
        images always showed ~47%, which is the direct cause of false leniency.

        Correct approach:
          - Raw SSIM of completely different images ≈ 0 or slightly negative
          - We use max(0, raw_ssim) so uncorrelated = 0%, not 50%
          - Apply a cubic power curve: scores below ~0.7 are pushed toward zero
            (e.g., raw 0.5 → 0.5³ = 0.125, not 50%)
        """
        raw, _ = ssim(p1, p2, full=True)
        # Clamp to [0, 1] — negative SSIM means active anticorrelation
        clamped = max(0.0, float(raw))
        # Power curve: makes the threshold harsher — only high raw SSIM survives
        curved = clamped ** 2.5
        return curved

    def _score_stroke_histogram(self, p1, p2):
        """
        Stroke Direction Histogram via Sobel gradients.
        Compares the angular distribution of ink strokes (weighted by magnitude).
        Uses cosine similarity between 36-bin histograms.
        """
        def get_angle_hist(img):
            sx = cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=3)
            sy = cv2.Sobel(img, cv2.CV_64F, 0, 1, ksize=3)
            angles = np.arctan2(sy, sx) * 180 / np.pi
            magnitude = np.sqrt(sx**2 + sy**2)
            hist, _ = np.histogram(angles, bins=36, range=(-180, 180), weights=magnitude)
            norm = np.linalg.norm(hist)
            return hist / norm if norm > 0 else hist

        h1 = get_angle_hist(p1)
        h2 = get_angle_hist(p2)
        raw_cos = float(np.dot(h1, h2))
        clamped = max(0.0, raw_cos)
        # Power curve: raise to 1.8 to push mid-range cosine scores down
        return clamped ** 1.8

    def _score_orb(self, p1, p2):
        """
        ORB Feature Keypoint Matching.
        Extracts pen-lift points, loops, and crossing strokes.
        Uses strict quality filtering: only matches with Hamming distance < 50.
        Requires minimum 6 good matches before any positive score is returned.
        """
        orb = cv2.ORB_create(nfeatures=600)
        kp1, des1 = orb.detectAndCompute(p1, None)
        kp2, des2 = orb.detectAndCompute(p2, None)

        if des1 is None or des2 is None or len(kp1) < 8 or len(kp2) < 8:
            return 0.0

        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)

        # Stricter distance threshold (50 vs old 60)
        good = [m for m in matches if m.distance < 50]

        # Require minimum baseline of 6 solid matches
        if len(good) < 6:
            return 0.0

        ratio = len(good) / max(len(kp1), len(kp2))
        # Cap at 1.0, aggressive scaling — still requires high ratio for high score
        return min(ratio * 2.0, 1.0) ** 1.5

    def _score_ink_density(self, p1, p2):
        """
        Ink Density Comparison.
        If two signatures have very different ink coverage ratios
        (e.g., dense signature vs sparse), they are structurally incompatible.
        A >15% absolute density gap maps to near-zero.
        """
        d1 = np.sum(p1 > 0) / p1.size
        d2 = np.sum(p2 > 0) / p2.size
        diff = abs(d1 - d2)
        # 0.15 = 15% density gap → 0 score
        return max(0.0, 1.0 - (diff / 0.15)) ** 2

    def _score_hu_moments(self, p1, p2):
        """
        Hu Moment Invariants.
        7 shape descriptors that are invariant to position, scale, and rotation.
        Captures the global topology of the signature (overall shape profile).
        Two different signatures have fundamentally different Hu moment profiles.
        """
        m1 = cv2.HuMoments(cv2.moments(p1)).flatten()
        m2 = cv2.HuMoments(cv2.moments(p2)).flatten()

        # Log transform to normalize magnitude (standard Hu moment practice)
        def log_transform(m):
            return -np.sign(m) * np.log10(np.abs(m) + 1e-10)

        lm1 = log_transform(m1)
        lm2 = log_transform(m2)

        # Normalized L2 distance → similarity
        dist = np.linalg.norm(lm1 - lm2)
        # A distance of ~2 means basically no shape overlap
        similarity = max(0.0, 1.0 - dist / 2.0)
        return similarity ** 2

    def calculate_similarity(self, sig1_b64, sig2_b64, roi=None):
        """
        Five-Phase Forensic Signature Comparison Pipeline.

        Phase weights (must sum to 1.0):
          1. Stroke Direction Histogram   20%
          2. SSIM (power-curved)          25%
          3. ORB Keypoint Matching        35%
          4. Ink Density Consistency       5%
          5. Hu Moment Shape Invariants   15%

        All phases use power curves or clamped scoring so that their
        floor is true 0% for non-matching content — eliminating the
        'always 47%' baseline that plagued the old formula.

        Match threshold: 82%
        """
        try:
            img1 = self.decode_base64(sig1_b64)
            img2 = self.decode_base64(sig2_b64)

            if img1 is None or img2 is None:
                raise ValueError("Failed to decode one or both images.")

            # Apply ROI crop to the cheque image (img1)
            if roi and img1 is not None:
                h, w = img1.shape[:2]
                rx = max(0, int(roi['x'] * w / 100))
                ry = max(0, int(roi['y'] * h / 100))
                rw = max(10, min(int(roi['w'] * w / 100), w - rx))
                rh = max(10, min(int(roi['h'] * h / 100), h - ry))
                img1 = img1[ry:ry+rh, rx:rx+rw]

            p1 = self.preprocess(img1)
            p2 = self.preprocess(img2)

            s_hist    = self._score_stroke_histogram(p1, p2)
            s_ssim    = self._score_ssim(p1, p2)
            s_orb     = self._score_orb(p1, p2)
            s_density = self._score_ink_density(p1, p2)
            s_hu      = self._score_hu_moments(p1, p2)

            weighted = (
                s_hist    * 0.20 +
                s_ssim    * 0.25 +
                s_orb     * 0.35 +
                s_density * 0.05 +
                s_hu      * 0.15
            )

            confidence = round(weighted * 100, 1)

            return {
                "score": confidence,
                "is_match": confidence >= self.match_threshold,
                "status": "success",
                "phases": {
                    "stroke_histogram": round(s_hist * 100, 1),
                    "ssim": round(s_ssim * 100, 1),
                    "orb_keypoints": round(s_orb * 100, 1),
                    "density": round(s_density * 100, 1),
                    "hu_moments": round(s_hu * 100, 1),
                }
            }

        except Exception as e:
            return {
                "score": 0,
                "is_match": False,
                "status": "error",
                "message": str(e)
            }

signature_processor = SignatureProcessor()
