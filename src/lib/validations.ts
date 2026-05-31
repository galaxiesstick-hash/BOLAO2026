import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  phone: z.string().optional(),
});

export const predictionSchema = z.object({
  matchId: z.string(),
  homeGoals: z.number().int().min(0).max(20),
  awayGoals: z.number().int().min(0).max(20),
});

export const poolConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  entryFee: z.number().positive(),
  pixKey: z.string().min(1),
  pixKeyType: z.enum(["cpf", "email", "phone", "random"]),
  beneficiaryName: z.string().min(1),
  scoringSystem: z.enum(["BALANCED", "SIMPLE", "SUPER_SIMPLE", "CUSTOM"]),
  lockMinutesBefore: z.number().int().min(1).max(60),
  enableQuestions: z.boolean(),
  enableDivisions: z.boolean(),
  enableAutoOdds: z.boolean(),
});

export const matchResultSchema = z.object({
  homeGoals: z.number().int().min(0),
  awayGoals: z.number().int().min(0),
  status: z.enum(["LIVE", "FINISHED", "SCHEDULED", "CANCELLED", "POSTPONED"]),
  minute: z.string().optional(),
});

export const oddsOverrideSchema = z.object({
  homeWinProb: z.number().min(1).max(98),
  drawProb: z.number().min(1).max(98),
  awayWinProb: z.number().min(1).max(98),
}).refine(
  (data) => {
    const sum = data.homeWinProb + data.drawProb + data.awayWinProb;
    return Math.abs(sum - 100) < 0.01;
  },
  { message: "Probabilidades devem somar 100%" }
);

export const questionSchema = z.object({
  matchId: z.string().optional(),
  text: z.string().min(1),
  type: z.enum(["FREE_TEXT", "MULTIPLE_CHOICE", "NUMBER"]),
  options: z.array(z.string()).optional(),
  pointsValue: z.number().int().min(1).max(50),
  deadline: z.string().datetime().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PredictionInput = z.infer<typeof predictionSchema>;
export type PoolConfigInput = z.infer<typeof poolConfigSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
