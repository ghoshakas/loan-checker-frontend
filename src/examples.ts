import type { LoanApplication } from "./types";

// Ready-made applications for the demo "Load example" buttons.
export const EXAMPLES: { label: string; app: LoanApplication }[] = [
  {
    label: "Approve",
    app: {
      applicant_name: "Rahul Sharma",
      age: 35,
      requested_amount: 1000000,
      loan_purpose: "home",
      annual_income: 1200000,
      employment_status: "salaried",
      employment_years: 5,
      existing_monthly_debt: 10000,
      credit_score: 720,
      collateral_value: null,
      documents_provided: ["id_proof", "income_proof", "bank_statement"],
      free_text: "",
    },
  },
  {
    label: "Reject",
    app: {
      applicant_name: "Sunil Verma",
      age: 30,
      requested_amount: 800000,
      loan_purpose: "personal",
      annual_income: 1000000,
      employment_status: "salaried",
      employment_years: 4,
      existing_monthly_debt: 8000,
      credit_score: 540,
      collateral_value: null,
      documents_provided: ["id_proof", "income_proof", "bank_statement"],
      free_text: "",
    },
  },
  {
    label: "Requires review",
    app: {
      applicant_name: "Nisha Rao",
      age: 33,
      requested_amount: 900000,
      loan_purpose: "car",
      annual_income: 1200000,
      employment_status: "salaried",
      employment_years: 5,
      existing_monthly_debt: 9000,
      credit_score: 610,
      collateral_value: null,
      documents_provided: ["id_proof", "income_proof", "bank_statement"],
      free_text: "",
    },
  },
  {
    label: "Extract from notes",
    app: {
      applicant_name: "",
      age: null,
      requested_amount: null,
      loan_purpose: null,
      annual_income: null,
      employment_status: null,
      employment_years: null,
      existing_monthly_debt: null,
      credit_score: null,
      collateral_value: null,
      documents_provided: [],
      free_text:
        "Hi, I'm 32 and work as a salaried software engineer, 6 years in the same job. I'd like a home loan of 15 lakh. My annual income is 15 lakh. Credit score is 760. I pay about 8000 a month on an existing loan. I can provide ID proof, income proof and bank statements.",
    },
  },
];
