import * as z from "zod";

export const incidentFormSchema = z.object({
  incidentId: z.string().optional(),
  incidentType: z.string().min(1, { message: "Incident type is required." }),
  incidentDate: z.string().optional(),
  incidentTime: z.string().optional(),
  location: z.string().min(1, { message: "Location is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  status: z.enum(["pending", "in_progress", "resolved"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  reportedBy: z.string().optional(),
  assignedTo: z.string().optional(),
  actionsTaken: z.string().optional(),
  resolution: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});