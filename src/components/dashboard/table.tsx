/** Simple responsive table: scrolls horizontally inside its card on small screens. */
export function Table({ children, caption }: { children: React.ReactNode; caption?: string }) {
    return (
        <div className="tw-overflow-x-auto -tw-mx-5 md:tw-mx-0">
            <table className="tw-w-full tw-text-md tw-border-collapse tw-min-w-[560px]">
                {caption && <caption className="tw-sr-only">{caption}</caption>}
                {children}
            </table>
        </div>
    );
}

export function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
    return (
        <th scope="col" className={`tw-text-left tw-font-medium tw-text-heading tw-border-b tw-border-gray-500 tw-px-3 tw-py-2.5 first:tw-pl-5 md:first:tw-pl-0 ${className}`}>
            {children}
        </th>
    );
}

export function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
    return (
        <td className={`tw-border-b tw-border-gray-500 tw-px-3 tw-py-3 tw-align-top first:tw-pl-5 md:first:tw-pl-0 ${className}`}>
            {children}
        </td>
    );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
    return (
        <tr>
            <td colSpan={colSpan} className="tw-px-3 tw-py-6 tw-text-center tw-text-gray-300">
                {children}
            </td>
        </tr>
    );
}
