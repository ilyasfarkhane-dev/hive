interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading..." }) => {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e7378] mb-4"></div>
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    );
  };
  
  export default LoadingSpinner;