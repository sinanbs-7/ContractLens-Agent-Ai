import { z } from 'zod';

export const DomainCategoryEnum = z.enum([
  'Vendor & Procurement Agreements',
  'Customer & Sales Contracts',
  'Partnership & Joint Venture',
  'Corporate & Employment',
  'Real Estate & Equipment'
]);

export const RenewalTypeEnum = z.enum(['Auto-Renew', 'Manual', 'Non-Renewing']);
export const RiskLevelEnum = z.enum(['Low', 'Medium', 'High', 'Critical']);
export const ClauseCategoryEnum = z.enum(['Liability', 'Indemnification', 'Termination', 'IP Right', 'Auto-Renewal']);
export const ObligationTypeEnum = z.enum(['Payment', 'Deliverable', 'Renewal Notice', 'Audit', 'Termination']);
export const RecurrencePatternEnum = z.enum(['Monthly', 'Quarterly', 'Semi-Annually', 'Annually']);

export const ContractIngestionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: DomainCategoryEnum,
  counterparty: z.string().min(1, 'Counterparty is required'),
  effectiveDate: z.string().nullable().optional(),
  expirationDate: z.string().nullable().optional(),
  renewalType: RenewalTypeEnum.default('Manual'),
  noticePeriodDays: z.number().default(30),
  noticeDeadlineDate: z.string().nullable().optional(),
  totalValue: z.number().nullable().optional(),
  currency: z.string().default('USD'),
  governingLaw: z.string().nullable().optional(),
  riskScore: z.number().min(0).max(100),
  obligations: z.array(
    z.object({
      partyResponsible: z.string(),
      obligationType: ObligationTypeEnum,
      description: z.string(),
      dueDate: z.string().nullable().optional(),
      isRecurring: z.boolean().default(false),
      recurrencePattern: RecurrencePatternEnum.nullable().optional(),
      citationText: z.string(),
      pageNumber: z.number().default(1),
      sectionNumber: z.string().nullable().optional()
    })
  ).default([]),
  risks: z.array(
    z.object({
      riskLevel: RiskLevelEnum,
      clauseCategory: ClauseCategoryEnum,
      explanation: z.string(),
      mitigationSuggestion: z.string().nullable().optional(),
      citationText: z.string(),
      pageNumber: z.number().default(1)
    })
  ).default([])
});

export const AgentChatQuerySchema = z.object({
  message: z.string().min(1, 'Query message cannot be empty'),
  contractId: z.string().uuid().optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string()
    })
  ).optional()
});

export const ContractDiffQuerySchema = z.object({
  contractIdA: z.string().uuid({ message: 'Valid UUID required for contractIdA' }),
  contractIdB: z.string().uuid({ message: 'Valid UUID required for contractIdB' })
});

export const AlertDismissSchema = z.object({
  isDismissed: z.boolean().default(true)
});

export const ContractFilterSchema = z.object({
  category: DomainCategoryEnum.optional(),
  search: z.string().optional(),
  riskScoreMin: z.coerce.number().min(0).max(100).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});
