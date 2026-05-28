import { Button } from "@literature/ui/button";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Literature</h1>
        <p>
          Dev-only copywriting for React — select visible UI text in the canvas,
          edit in place, and apply changes back to source files.
        </p>
        <Button appName="literature" className={styles.secondary}>
          Scaffold ready
        </Button>
      </main>
    </div>
  );
}
