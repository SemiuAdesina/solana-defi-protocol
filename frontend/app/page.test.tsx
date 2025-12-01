import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../components/Header", () => ({
  Header: () => <div>Header</div>
}));

vi.mock("../components/Hero", () => ({
  Hero: () => <div>Hero</div>
}));

vi.mock("../components/Footer", () => ({
  Footer: () => <div>Footer</div>
}));

vi.mock("../components/SectionDivider", () => ({
  SectionDivider: () => <div>SectionDivider</div>
}));

vi.mock("../components/WalletSection", () => ({
  WalletSection: () => <div>WalletSection</div>
}));

vi.mock("../components/SubsidyChecklist", () => ({
  SubsidyChecklist: () => <div>SubsidyChecklist</div>
}));

vi.mock("../components/MetadataCard", () => ({
  MetadataCard: () => <div>MetadataCard</div>
}));

vi.mock("../components/CiStatusBoard", () => ({
  CiStatusBoard: () => <div>CiStatusBoard</div>
}));

vi.mock("../components/GraphExplorer", () => ({
  __esModule: true,
  default: () => <div>GraphExplorer</div>
}));

vi.mock("swr", () => ({
  __esModule: true,
  default: () => ({ data: null, isLoading: false })
}));

vi.mock("next/dynamic", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (_loader: any) => {
    const Component = () => <div>Dynamic Component</div>;
    Component.displayName = "DynamicComponent";
    return Component;
  }
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useConnection: () => ({
    connection: {
      rpcEndpoint: "https://api.devnet.solana.com"
    }
  }),
  useWallet: () => ({
    publicKey: null,
    signTransaction: null
  })
}));

vi.mock("../lib/useMediaQuery", () => ({
  useMediaQuery: () => false
}));

import HomePage from "./page";

describe("HomePage", () => {
  it("renders without errors", () => {
    const { container } = render(<HomePage />);
    expect(container).toBeInTheDocument();
    // Verify main structure is rendered
    expect(container.querySelector("div")).toBeInTheDocument();
  });
});

