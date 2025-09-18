import * as React from "react";
import { cn } from "../../lib/utils";
const Dropdown = ({ trigger, children, align = 'start' }) => {
    const [open, setOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const alignClasses = {
        start: 'left-0',
        center: 'left-1/2 transform -translate-x-1/2',
        end: 'right-0'
    };
    return (<div className="relative" ref={dropdownRef}>
            <div onClick={() => setOpen(!open)}>
                {trigger}
            </div>
            {open && (<div className={cn("absolute top-full mt-1 min-w-[200px] bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50", alignClasses[align])}>
                    {children}
                </div>)}
        </div>);
};
const DropdownItem = ({ children, onClick, className }) => {
    return (<button className={cn("w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none", className)} onClick={onClick}>
            {children}
        </button>);
};
export { Dropdown, DropdownItem };
