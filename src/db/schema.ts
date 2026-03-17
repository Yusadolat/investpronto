import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  date,
  primaryKey,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'admin',
  'operator',
  'investor',
]);

export const hostelStatusEnum = pgEnum('hostel_status', [
  'active',
  'inactive',
  'setup',
]);

export const recurringCostFrequencyEnum = pgEnum('recurring_cost_frequency', [
  'monthly',
  'quarterly',
  'annual',
]);

export const membershipRoleEnum = pgEnum('membership_role', [
  'admin',
  'operator',
  'investor',
]);

export const agreementTypeEnum = pgEnum('agreement_type', [
  'profit_share',
  'revenue_share',
  'equity',
  'custom',
]);

export const agreementStatusEnum = pgEnum('agreement_status', [
  'active',
  'terminated',
  'pending',
]);

export const revenueSourceEnum = pgEnum('revenue_source', [
  'manual',
  'paystack',
  'bank_transfer',
  'cash',
]);

export const revenueStatusEnum = pgEnum('revenue_status', [
  'verified',
  'pending',
  'refunded',
  'reversed',
]);

export const expenseCategoryEnum = pgEnum('expense_category', [
  'bandwidth',
  'power_fuel',
  'maintenance',
  'staff_operations',
  'device_replacement',
  'miscellaneous',
]);

export const setupCostTypeEnum = pgEnum('setup_cost_type', [
  'one_time',
  'recurring',
]);

export const capitalContributorTypeEnum = pgEnum('capital_contributor_type', [
  'founder',
  'cofounder',
  'investor',
  'other',
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'approved',
  'pending',
  'rejected',
]);

export const payoutStatusEnum = pgEnum('payout_status', [
  'pending',
  'paid',
  'cancelled',
]);

// ─── Tables ──────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: varchar('image', { length: 512 }),
  role: userRoleEnum('role').notNull().default('investor'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', {
      length: 255,
    }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ]
);

export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 })
    .notNull()
    .primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const hostels = pgTable('hostels', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  address: text('address').notNull(),
  totalSetupCost: numeric('total_setup_cost', {
    precision: 12,
    scale: 2,
  }).notNull(),
  founderContribution: numeric('founder_contribution', {
    precision: 12,
    scale: 2,
  }).notNull(),
  status: hostelStatusEnum('status').notNull().default('setup'),
  companySharePercent: numeric('company_share_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  ownerSharePercent: numeric('owner_share_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  investorPoolPercent: numeric('investor_pool_percent', { precision: 5, scale: 2 }).notNull().default('100'),
  reserveFundPercent: numeric('reserve_fund_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  minimumPayoutAmount: numeric('minimum_payout_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    hostelId: uuid('hostel_id')
      .notNull()
      .references(() => hostels.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('memberships_user_hostel_idx').on(table.userId, table.hostelId)]
);

export const investmentAgreements = pgTable('investment_agreements', {
  id: uuid('id').defaultRandom().primaryKey(),
  hostelId: uuid('hostel_id')
    .notNull()
    .references(() => hostels.id, { onDelete: 'cascade' }),
  investorUserId: uuid('investor_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amountInvested: numeric('amount_invested', {
    precision: 12,
    scale: 2,
  }).notNull(),
  dateInvested: date('date_invested').notNull(),
  agreementType: agreementTypeEnum('agreement_type').notNull(),
  percentageShare: numeric('percentage_share', {
    precision: 5,
    scale: 2,
  }).notNull(),
  customTerms: text('custom_terms'),
  notes: text('notes'),
  status: agreementStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const revenueEntries = pgTable('revenue_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  hostelId: uuid('hostel_id')
    .notNull()
    .references(() => hostels.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  source: revenueSourceEnum('source').notNull(),
  description: text('description'),
  transactionDate: date('transaction_date').notNull(),
  month: integer('month').notNull(),
  paystackReference: varchar('paystack_reference', { length: 255 }),
  status: revenueStatusEnum('status').notNull().default('pending'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const paystackTransactions = pgTable('paystack_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  hostelId: uuid('hostel_id')
    .notNull()
    .references(() => hostels.id, { onDelete: 'cascade' }),
  reference: varchar('reference', { length: 255 }).notNull().unique(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  fees: numeric('fees', { precision: 12, scale: 2 }).notNull(),
  netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('NGN'),
  status: varchar('status', { length: 50 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerName: varchar('customer_name', { length: 255 }),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  metadata: jsonb('metadata'),
  channel: varchar('channel', { length: 50 }),
  reconciled: boolean('reconciled').notNull().default(false),
  reconciledRevenueEntryId: uuid('reconciled_revenue_entry_id').references(
    () => revenueEntries.id
  ),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const expenseEntries = pgTable('expense_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  hostelId: uuid('hostel_id')
    .notNull()
    .references(() => hostels.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  category: expenseCategoryEnum('category').notNull(),
  description: text('description').notNull(),
  expenseDate: date('expense_date').notNull(),
  month: integer('month').notNull(),
  receiptUrl: varchar('receipt_url', { length: 512 }),
  spenderName: varchar('spender_name', { length: 255 }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  approvalStatus: approvalStatusEnum('approval_status')
    .notNull()
    .default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const setupCostItems = pgTable('setup_cost_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  hostelId: uuid('hostel_id')
    .notNull()
    .references(() => hostels.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  costType: setupCostTypeEnum('cost_type').notNull().default('one_time'),
  incurredAt: date('incurred_at').notNull(),
  vendor: varchar('vendor', { length: 255 }),
  receiptUrl: varchar('receipt_url', { length: 512 }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const capitalContributions = pgTable('capital_contributions', {
  id: uuid('id').defaultRandom().primaryKey(),
  hostelId: uuid('hostel_id')
    .notNull()
    .references(() => hostels.id, { onDelete: 'cascade' }),
  contributorName: varchar('contributor_name', { length: 255 }).notNull(),
  contributorType: capitalContributorTypeEnum('contributor_type')
    .notNull()
    .default('other'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  contributionDate: date('contribution_date').notNull(),
  linkedInvestorUserId: uuid('linked_investor_user_id').references(() => users.id),
  notes: text('notes'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const monthlyFinancialSnapshots = pgTable(
  'monthly_financial_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    hostelId: uuid('hostel_id')
      .notNull()
      .references(() => hostels.id, { onDelete: 'cascade' }),
    month: integer('month').notNull(),
    grossRevenue: numeric('gross_revenue', {
      precision: 12,
      scale: 2,
    }).notNull(),
    refunds: numeric('refunds', { precision: 12, scale: 2 }).notNull(),
    netRevenue: numeric('net_revenue', { precision: 12, scale: 2 }).notNull(),
    totalExpenses: numeric('total_expenses', {
      precision: 12,
      scale: 2,
    }).notNull(),
    netProfit: numeric('net_profit', { precision: 12, scale: 2 }).notNull(),
    calculatedAt: timestamp('calculated_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('snapshots_hostel_month_idx').on(table.hostelId, table.month),
  ]
);

export const payouts = pgTable('payouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  hostelId: uuid('hostel_id')
    .notNull()
    .references(() => hostels.id, { onDelete: 'cascade' }),
  investorUserId: uuid('investor_user_id')
    .notNull()
    .references(() => users.id),
  agreementId: uuid('agreement_id')
    .notNull()
    .references(() => investmentAgreements.id),
  month: integer('month').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: payoutStatusEnum('status').notNull().default('pending'),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  reference: varchar('reference', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const recurringCosts = pgTable('recurring_costs', {
  id: uuid('id').defaultRandom().primaryKey(),
  hostelId: uuid('hostel_id')
    .notNull()
    .references(() => hostels.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  monthlyAmount: numeric('monthly_amount', { precision: 12, scale: 2 }).notNull(),
  frequency: recurringCostFrequencyEnum('frequency').notNull().default('monthly'),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  hostelId: uuid('hostel_id').references(() => hostels.id),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 255 }).notNull(),
  entityId: varchar('entity_id', { length: 255 }),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  hostelId: uuid('hostel_id')
    .notNull()
    .references(() => hostels.id, { onDelete: 'cascade' }),
  role: membershipRoleEnum('role').notNull(),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  acceptedAt: timestamp('accepted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  memberships: many(memberships),
  investmentAgreements: many(investmentAgreements),
  revenueEntries: many(revenueEntries),
  expenseEntries: many(expenseEntries),
  payouts: many(payouts),
  auditLogs: many(auditLogs),
  invitationsSent: many(invitations),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  hostels: many(hostels),
}));

export const hostelsRelations = relations(hostels, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [hostels.organizationId],
    references: [organizations.id],
  }),
  memberships: many(memberships),
  investmentAgreements: many(investmentAgreements),
  revenueEntries: many(revenueEntries),
  paystackTransactions: many(paystackTransactions),
  expenseEntries: many(expenseEntries),
  setupCostItems: many(setupCostItems),
  capitalContributions: many(capitalContributions),
  monthlyFinancialSnapshots: many(monthlyFinancialSnapshots),
  payouts: many(payouts),
  auditLogs: many(auditLogs),
  invitations: many(invitations),
  recurringCosts: many(recurringCosts),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  hostel: one(hostels, {
    fields: [memberships.hostelId],
    references: [hostels.id],
  }),
}));

export const investmentAgreementsRelations = relations(
  investmentAgreements,
  ({ one, many }) => ({
    hostel: one(hostels, {
      fields: [investmentAgreements.hostelId],
      references: [hostels.id],
    }),
    investor: one(users, {
      fields: [investmentAgreements.investorUserId],
      references: [users.id],
    }),
    payouts: many(payouts),
  })
);

export const revenueEntriesRelations = relations(
  revenueEntries,
  ({ one }) => ({
    hostel: one(hostels, {
      fields: [revenueEntries.hostelId],
      references: [hostels.id],
    }),
    creator: one(users, {
      fields: [revenueEntries.createdBy],
      references: [users.id],
    }),
  })
);

export const paystackTransactionsRelations = relations(
  paystackTransactions,
  ({ one }) => ({
    hostel: one(hostels, {
      fields: [paystackTransactions.hostelId],
      references: [hostels.id],
    }),
    reconciledRevenueEntry: one(revenueEntries, {
      fields: [paystackTransactions.reconciledRevenueEntryId],
      references: [revenueEntries.id],
    }),
  })
);

export const expenseEntriesRelations = relations(
  expenseEntries,
  ({ one }) => ({
    hostel: one(hostels, {
      fields: [expenseEntries.hostelId],
      references: [hostels.id],
    }),
    creator: one(users, {
      fields: [expenseEntries.createdBy],
      references: [users.id],
      relationName: 'expenseCreator',
    }),
    approver: one(users, {
      fields: [expenseEntries.approvedBy],
      references: [users.id],
      relationName: 'expenseApprover',
    }),
  })
);

export const setupCostItemsRelations = relations(
  setupCostItems,
  ({ one }) => ({
    hostel: one(hostels, {
      fields: [setupCostItems.hostelId],
      references: [hostels.id],
    }),
    creator: one(users, {
      fields: [setupCostItems.createdBy],
      references: [users.id],
      relationName: 'setupCostItemCreator',
    }),
  })
);

export const capitalContributionsRelations = relations(
  capitalContributions,
  ({ one }) => ({
    hostel: one(hostels, {
      fields: [capitalContributions.hostelId],
      references: [hostels.id],
    }),
    creator: one(users, {
      fields: [capitalContributions.createdBy],
      references: [users.id],
      relationName: 'capitalContributionCreator',
    }),
    linkedInvestor: one(users, {
      fields: [capitalContributions.linkedInvestorUserId],
      references: [users.id],
      relationName: 'capitalContributionLinkedInvestor',
    }),
  })
);

export const monthlyFinancialSnapshotsRelations = relations(
  monthlyFinancialSnapshots,
  ({ one }) => ({
    hostel: one(hostels, {
      fields: [monthlyFinancialSnapshots.hostelId],
      references: [hostels.id],
    }),
  })
);

export const payoutsRelations = relations(payouts, ({ one }) => ({
  hostel: one(hostels, {
    fields: [payouts.hostelId],
    references: [hostels.id],
  }),
  investor: one(users, {
    fields: [payouts.investorUserId],
    references: [users.id],
  }),
  agreement: one(investmentAgreements, {
    fields: [payouts.agreementId],
    references: [investmentAgreements.id],
  }),
}));

export const recurringCostsRelations = relations(recurringCosts, ({ one }) => ({
  hostel: one(hostels, {
    fields: [recurringCosts.hostelId],
    references: [hostels.id],
  }),
  creator: one(users, {
    fields: [recurringCosts.createdBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  hostel: one(hostels, {
    fields: [auditLogs.hostelId],
    references: [hostels.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  hostel: one(hostels, {
    fields: [invitations.hostelId],
    references: [hostels.id],
  }),
  inviter: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));
