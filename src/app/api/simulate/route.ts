import { connectDB } from '@/lib/mongodb';
import { runSimulation } from '@/services/simulationService';
import { successResponse, errorResponse } from '@/lib/apiHandler';

export async function POST() {
  try {
    await connectDB();
    const result = await runSimulation();
    return successResponse(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Simulation failed';
    console.error('[/api/simulate]', message);
    return errorResponse(message);
  }
}
