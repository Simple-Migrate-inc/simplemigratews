export default function FormMessage({
    tone = "error",
    children,
}: {
    tone?: "error" | "success" | "info";
    children: React.ReactNode;
}) {
    if (!children) return null;
    const cls = {
        error: "tw-bg-danger/10 tw-text-danger tw-border-danger/30",
        success: "tw-bg-success/10 tw-text-success tw-border-success/30",
        info: "tw-bg-info/10 tw-text-info tw-border-info/30",
    }[tone];
    return (
        <div role={tone === "error" ? "alert" : "status"} className={`tw-border tw-rounded tw-px-4 tw-py-3 tw-text-md tw-mb-5 ${cls}`}>
            {children}
        </div>
    );
}
