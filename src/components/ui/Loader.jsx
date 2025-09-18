import * as React from "react";
import { cn } from "../../lib/utils";
const Loader = ({ className, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };
    return (<div className={cn("flex items-center justify-center", className)}>
            <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-blue-600", sizeClasses[size])}/>
        </div>);
};
export { Loader };
