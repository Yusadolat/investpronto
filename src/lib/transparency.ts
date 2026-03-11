import { calculatePercentage } from "./utils";

export type SetupCostType = "one_time" | "recurring";
export type CapitalContributorType =
  | "founder"
  | "cofounder"
  | "investor"
  | "other";

export interface TransparencyHostelInput {
  totalSetupCost: number;
}

export interface TransparencySetupItemInput {
  id: string;
  amount: number;
  costType: SetupCostType;
  category: string;
}

export interface TransparencyContributionInput {
  id: string;
  contributorName: string;
  contributorType: CapitalContributorType;
  amount: number;
}

export interface SetupSummary {
  totalBudget: number;
  totalRecorded: number;
  oneTimeTotal: number;
  recurringTotal: number;
  remainingBudget: number;
  overBudgetAmount: number;
}

export interface CapitalSummary {
  totalContributed: number;
  founderCapital: number;
  cofounderCapital: number;
  investorCapital: number;
  otherCapital: number;
  fundingGap: number;
  excessCapital: number;
  contributions: Array<
    TransparencyContributionInput & {
      capitalPercentage: number;
    }
  >;
}

export interface TransparencySummary {
  setup: SetupSummary;
  capital: CapitalSummary;
}

export function buildTransparencySummary(
  hostel: TransparencyHostelInput,
  setupItems: TransparencySetupItemInput[],
  contributions: TransparencyContributionInput[]
): TransparencySummary {
  const totalRecorded = roundMoney(
    setupItems.reduce((sum, item) => sum + item.amount, 0)
  );
  const oneTimeTotal = roundMoney(
    setupItems
      .filter((item) => item.costType === "one_time")
      .reduce((sum, item) => sum + item.amount, 0)
  );
  const recurringTotal = roundMoney(
    setupItems
      .filter((item) => item.costType === "recurring")
      .reduce((sum, item) => sum + item.amount, 0)
  );
  const totalContributed = roundMoney(
    contributions.reduce((sum, item) => sum + item.amount, 0)
  );

  const founderCapital = sumContributionType(contributions, "founder");
  const cofounderCapital = sumContributionType(contributions, "cofounder");
  const investorCapital = sumContributionType(contributions, "investor");
  const otherCapital = sumContributionType(contributions, "other");

  return {
    setup: {
      totalBudget: roundMoney(hostel.totalSetupCost),
      totalRecorded,
      oneTimeTotal,
      recurringTotal,
      remainingBudget: roundMoney(Math.max(hostel.totalSetupCost - totalRecorded, 0)),
      overBudgetAmount: roundMoney(Math.max(totalRecorded - hostel.totalSetupCost, 0)),
    },
    capital: {
      totalContributed,
      founderCapital,
      cofounderCapital,
      investorCapital,
      otherCapital,
      fundingGap: roundMoney(Math.max(hostel.totalSetupCost - totalContributed, 0)),
      excessCapital: roundMoney(Math.max(totalContributed - hostel.totalSetupCost, 0)),
      contributions: contributions.map((contribution) => ({
        ...contribution,
        amount: roundMoney(contribution.amount),
        capitalPercentage: calculatePercentage(
          contribution.amount,
          hostel.totalSetupCost
        ),
      })),
    },
  };
}

function sumContributionType(
  contributions: TransparencyContributionInput[],
  contributorType: CapitalContributorType
): number {
  return roundMoney(
    contributions
      .filter((item) => item.contributorType === contributorType)
      .reduce((sum, item) => sum + item.amount, 0)
  );
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
