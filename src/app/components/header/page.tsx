"use client";

import React from "react";
import { Typography } from "@progress/kendo-react-common";
import { Button } from "@progress/kendo-react-buttons";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";

const StickyHeader = () => {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer} onClick={() => router.push("/")}>
        <img src="/logo.png" alt="Logo" className={styles.logo} />
      </div>
      <nav className={styles.nav}>
        <Button
          themeColor="tertiary"
          fillMode={"flat"}
          onClick={() => router.push("/docs")}
          className={styles.navButton}
        >
          Documentation
        </Button>
        {session ? (
          <div className={styles.authContainer}>
            <Typography.p className={styles.authText}>
              Welcome, {session.user?.name || session.user?.login}
            </Typography.p>
            <Button
              themeColor="secondary"
              size={"large"}
              onClick={() => signOut()}
              className={styles.authButton}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            themeColor="primary"
            onClick={() => signIn("github")}
            size={"large"}
            className={styles.authButton}
          >
            Connect with GitHub
          </Button>
        )}
      </nav>
    </header>
  );
};

export default StickyHeader;
