declare module "next/dynamic" {
  import type { ComponentType } from "react";

  type DynamicOptions<P = Record<string, never>> = {
    ssr?: boolean;
    loading?: ComponentType;
  };

  type Loader<P = Record<string, never>> = () =>
    | Promise<{ default: ComponentType<P> } | ComponentType<P>>
    | ComponentType<P>;

  export default function dynamic<P = Record<string, never>>(
    loader: Loader<P>,
    options?: DynamicOptions<P>,
  ): ComponentType<P>;
}
