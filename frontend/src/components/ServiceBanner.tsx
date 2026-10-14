import { RotateCw, ServerCrash } from "lucide-react";
import "./ServiceBanner.css";

interface ServiceBannerProps {
    message: string;
    onRetry: () => void;
}

function ServiceBanner({ message, onRetry }: ServiceBannerProps) {
    return (
        <div className="service-banner" role="alert">
            <ServerCrash size={18} className="service-banner-icon" />
            <div className="service-banner-text">
                <p className="service-banner-title">
                    Translation is unavailable
                </p>
                <p className="service-banner-message">{message}</p>
            </div>
            <button className="service-banner-retry" onClick={onRetry}>
                <RotateCw size={14} />
                Retry
            </button>
        </div>
    );
}

export default ServiceBanner;
