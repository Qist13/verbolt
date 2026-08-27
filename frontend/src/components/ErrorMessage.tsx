import "./ErrorMessage.css";

interface ErrorMessageProps {
    message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
    if (!message) return null;

    return <p className="error-text">{message}</p>;
}

export default ErrorMessage;
