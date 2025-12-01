import { PublicKey } from "@solana/web3.js";
import type { CiStatusService } from "../services/ci-status/types.js";
import type { RegistryService } from "../services/registry/types.js";

export type GraphContext = {
  registryService: RegistryService;
  ciStatusService: CiStatusService;
};

type Resolvers = {
  Query: {
    registry: (
      parent: unknown,
      args: { authority: string },
      ctx: GraphContext
    ) => Promise<Awaited<ReturnType<RegistryService["getRegistryByAuthority"]>>>;
    ciStatuses: (
      parent: unknown,
      args: { limit?: number },
      ctx: GraphContext
    ) => Promise<Awaited<ReturnType<CiStatusService["getRecent"]>>>;
    ciStatus: (
      parent: unknown,
      args: { runId: string },
      ctx: GraphContext
    ) => Promise<Awaited<ReturnType<CiStatusService["getStatus"]>>>;
  };
};

export const createResolvers = (): Resolvers => ({
  Query: {
    registry: async (_parent, args, ctx) => {
      // Validate authority is a valid Solana address
      try {
        new PublicKey(args.authority);
      } catch (error) {
        throw new Error(
          `Invalid authority address: "${args.authority}". ` +
          `Please provide a valid Solana address (base58 encoded, 32-44 characters). ` +
          `Example: "EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA"`
        );
      }
      return ctx.registryService.getRegistryByAuthority(args.authority);
    },
    ciStatuses: async (_parent, args, ctx) => {
      return ctx.ciStatusService.getRecent(args.limit);
    },
    ciStatus: async (_parent, args, ctx) => {
      return ctx.ciStatusService.getStatus(args.runId);
    }
  }
});

