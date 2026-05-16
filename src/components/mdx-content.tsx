"use client";

import * as runtime from "react/jsx-runtime";
import { mdxComponents } from "@/components/mdx-components";

const useMDXComponent = (code: string) => {
  const fn = new Function(code);
  return fn({ ...runtime }).default;
};

interface MDXContentProps {
  readonly code: string;
}

export function MDXContent({ code }: MDXContentProps) {
  const Component = useMDXComponent(code);
  return <Component components={mdxComponents} />;
}
