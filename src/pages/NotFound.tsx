import { useLocation } from "react-router-dom";
import { useEffect } from "react";

interface NotFoundProps {
  message?: string;
}

const NotFound = ({ message }: NotFoundProps) => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent or invalid route:",
      location.pathname,
      message ? `Reason: ${message}` : ""
    );
  }, [location.pathname, message]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="text-center max-w-lg">
        <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
        <p className="text-2xl text-gray-800 mb-2">Oops! Page not found</p>
        {message && (
          <p 
            className="text-destructive font-medium mb-6 bg-destructive/10 p-3 rounded-lg border border-destructive/20"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        )}
        <a 
          href="/" 
          className="inline-block px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-md"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
