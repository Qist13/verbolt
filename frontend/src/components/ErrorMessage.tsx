import { CircleAlert } from "lucide-react";
import "./ErrorMessage.css";

interface ErrorMessageProps {
    message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
    if (!message) return null;

    return (
        <p className="error-text" role="alert">
            <CircleAlert size={16} />
            {message}
        </p>
    );
}

export default ErrorMessage;
