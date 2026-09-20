import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// System Model Constants
export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash';
export const GEMINI_MODEL_EMBEDDING = 'text-embedding-004';

// Check API Key
const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('[WARNING] GEMINI_API_KEY is not set in environment. Live AI calls will use intelligent mock agent fallback until an API key is configured.');
}

// Instantiate official Google GenAI SDK
export const ai = new GoogleGenAI({
  apiKey: apiKey || 'DUMMY_KEY_FOR_INITIALIZATION'
});

// Mathematical Tool Declarations for Agent Function Calling
export const mathematicalToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'calculateRemainingDays',
    description: 'Calculates the exact number of days remaining between current date and a target contract deadline or expiration date.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        targetDate: {
          type: Type.STRING,
          description: 'Target date in YYYY-MM-DD format.'
        }
      },
      required: ['targetDate']
    }
  },
  {
    name: 'calculateNoticeDeadline',
    description: 'Calculates the exact notice deadline date by subtracting notice period days from contract expiration date.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        expirationDate: {
          type: Type.STRING,
          description: 'Contract expiration date in YYYY-MM-DD format.'
        },
        noticePeriodDays: {
          type: Type.NUMBER,
          description: 'Number of days notice required before expiration (e.g., 30, 60, 90).'
        }
      },
      required: ['expirationDate', 'noticePeriodDays']
    }
  },
  {
    name: 'calculateTotalContractValue',
    description: 'Computes total contract value by multiplying recurring periodic payment installments across contract duration.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        installmentAmount: {
          type: Type.NUMBER,
          description: 'Amount per installment payment.'
        },
        frequency: {
          type: Type.STRING,
          description: 'Frequency of payments: Monthly, Quarterly, Semi-Annually, Annually.'
        },
        durationMonths: {
          type: Type.NUMBER,
          description: 'Total duration of contract in months.'
        }
      },
      required: ['installmentAmount', 'frequency', 'durationMonths']
    }
  },
  {
    name: 'calculatePenaltyInterest',
    description: 'Calculates statutory or contractual penalty interest for late payments given overdue principal, monthly percentage rate, and overdue days.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        overduePrincipal: {
          type: Type.NUMBER,
          description: 'Unpaid invoice balance amount.'
        },
        monthlyInterestRatePercent: {
          type: Type.NUMBER,
          description: 'Monthly interest rate percentage (e.g., 1.5 for 1.5% per month).'
        },
        overdueDays: {
          type: Type.NUMBER,
          description: 'Number of calendar days invoice is past due.'
        }
      },
      required: ['overduePrincipal', 'monthlyInterestRatePercent', 'overdueDays']
    }
  }
];

// Mathematical Tool Implementation Handlers
export const mathematicalToolExecutors: Record<string, (args: any) => any> = {
  calculateRemainingDays: ({ targetDate }: { targetDate: string }) => {
    const target = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      targetDate,
      currentDate: today.toISOString().split('T')[0],
      daysRemaining: diffDays,
      isExpired: diffDays < 0,
      isUrgent: diffDays >= 0 && diffDays <= 30
    };
  },

  calculateNoticeDeadline: ({ expirationDate, noticePeriodDays }: { expirationDate: string; noticePeriodDays: number }) => {
    const exp = new Date(expirationDate);
    const deadline = new Date(exp);
    deadline.setDate(exp.getDate() - noticePeriodDays);
    const deadlineStr = deadline.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilNotice = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      expirationDate,
      noticePeriodDays,
      noticeDeadlineDate: deadlineStr,
      daysUntilNoticeDeadline: daysUntilNotice,
      isPastNoticeDeadline: daysUntilNotice < 0
    };
  },

  calculateTotalContractValue: ({ installmentAmount, frequency, durationMonths }: { installmentAmount: number; frequency: string; durationMonths: number }) => {
    let installmentsPerYear = 12;
    const freqLower = frequency.toLowerCase();
    if (freqLower.includes('month')) installmentsPerYear = 12;
    else if (freqLower.includes('quarter')) installmentsPerYear = 4;
    else if (freqLower.includes('semi')) installmentsPerYear = 2;
    else if (freqLower.includes('annual') || freqLower.includes('year')) installmentsPerYear = 1;

    const totalInstallments = Math.round((durationMonths / 12) * installmentsPerYear);
    const totalValue = installmentAmount * totalInstallments;

    return {
      installmentAmount,
      frequency,
      durationMonths,
      totalInstallments,
      totalContractValue: totalValue
    };
  },

  calculatePenaltyInterest: ({ overduePrincipal, monthlyInterestRatePercent, overdueDays }: { overduePrincipal: number; monthlyInterestRatePercent: number; overdueDays: number }) => {
    const dailyRate = (monthlyInterestRatePercent / 100) / 30;
    const penaltyInterest = overduePrincipal * dailyRate * overdueDays;
    const totalPayable = overduePrincipal + penaltyInterest;

    return {
      overduePrincipal,
      monthlyInterestRatePercent,
      overdueDays,
      accruedPenaltyInterest: Number(penaltyInterest.toFixed(2)),
      totalAmountPayable: Number(totalPayable.toFixed(2))
    };
  }
};
