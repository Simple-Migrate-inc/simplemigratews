"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { authClient } from "@dashboard/auth/client";
import type { NavItem } from "./nav-config";

type Props = {
    nav: NavItem[];
    userName: string;
    roleLabel: string;
    children: React.ReactNode;
};

function isActive(pathname: string, item: NavItem) {
    return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function Shell({ nav, userName, roleLabel, children }: Props) {
    const pathname = usePathname() ?? "";
    const router = useRouter();

    const signOut = async () => {
        await authClient.signOut();
        router.push("/app/login");
        router.refresh();
    };

    return (
        <div className="tw-min-h-screen lg:tw-flex">
            <a href="#main" className="tw-sr-only focus:tw-not-sr-only focus:tw-absolute focus:tw-z-50 focus:tw-bg-white focus:tw-p-3">
                Skip to content
            </a>

            {/* Desktop sidebar */}
            <aside className="tw-hidden lg:tw-flex tw-flex-col tw-w-[260px] tw-shrink-0 tw-bg-white tw-border-r tw-border-gray-500 tw-sticky tw-top-0 tw-h-screen">
                <div className="tw-px-6 tw-py-6 tw-border-b tw-border-gray-500">
                    <Link href="/" aria-label="Simple Migrate home">
                        <img src="/images/logo/sm-logo.png" alt="Simple Migrate" width={150} height={35} />
                    </Link>
                </div>
                <nav aria-label="Dashboard" className="tw-flex-1 tw-overflow-y-auto tw-py-4">
                    <ul>
                        {nav.map((item) => {
                            const active = isActive(pathname, item);
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        aria-current={active ? "page" : undefined}
                                        className={clsx(
                                            "tw-flex tw-items-center tw-gap-3 tw-px-6 tw-py-2.5 tw-text-md tw-font-medium tw-border-l-[3px]",
                                            active
                                                ? "tw-border-primary tw-text-primary tw-bg-primary/5"
                                                : "tw-border-transparent tw-text-heading hover:tw-text-primary"
                                        )}
                                    >
                                        <i className={`fas ${item.icon} tw-w-5 tw-text-center`} aria-hidden />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                <div className="tw-px-6 tw-py-5 tw-border-t tw-border-gray-500">
                    <p className="tw-text-md tw-font-medium tw-text-heading tw-mb-0 tw-truncate">{userName}</p>
                    <p className="tw-text-sm tw-mb-3">{roleLabel}</p>
                    <button type="button" onClick={signOut} className="tw-text-md tw-text-secondary hover:tw-text-primary">
                        <i className="fas fa-sign-out-alt tw-mr-2" aria-hidden />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Mobile top bar */}
            <header className="lg:tw-hidden tw-flex tw-items-center tw-justify-between tw-bg-white tw-border-b tw-border-gray-500 tw-px-4 tw-h-14">
                <Link href="/" aria-label="Simple Migrate home">
                    <img src="/images/logo/sm-logo.png" alt="Simple Migrate" width={120} height={28} />
                </Link>
                <button type="button" onClick={signOut} className="tw-text-md tw-text-secondary" aria-label="Sign out">
                    <i className="fas fa-sign-out-alt" aria-hidden />
                </button>
            </header>

            <main id="main" className="tw-flex-1 tw-min-w-0 tw-px-4 tw-pt-6 tw-pb-24 md:tw-px-7.5 lg:tw-px-10 lg:tw-py-10">
                <div className="tw-max-w-[1100px] tw-mx-auto">{children}</div>
            </main>

            {/* Mobile bottom nav */}
            <nav aria-label="Dashboard" className="lg:tw-hidden tw-fixed tw-bottom-0 tw-inset-x-0 tw-bg-white tw-border-t tw-border-gray-500 tw-z-40">
                <ul className="tw-flex">
                    {nav.slice(0, 5).map((item) => {
                        const active = isActive(pathname, item);
                        return (
                            <li key={item.href} className="tw-flex-1">
                                <Link
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    className={clsx(
                                        "tw-flex tw-flex-col tw-items-center tw-gap-0.5 tw-py-2 tw-text-[11px] tw-leading-tight",
                                        active ? "tw-text-primary" : "tw-text-body"
                                    )}
                                >
                                    <i className={`fas ${item.icon} tw-text-lg`} aria-hidden />
                                    <span className="tw-truncate tw-max-w-full tw-px-1">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
