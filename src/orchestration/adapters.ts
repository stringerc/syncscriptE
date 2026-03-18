import type { OrchestrationAdapter, OrchestrationRequest, OrchestrationResponse } from './types';

type SendMessageFn = (payload: any) => Promise<any>;

export function createOpenClawAdapter(sendMessage: SendMessageFn): OrchestrationAdapter {
  return {
    provider: 'openclaw',
    isAvailable: () => true,
    execute: async (request: OrchestrationRequest): Promise<OrchestrationResponse> => {
      const response = await sendMessage({
        message: request.message,
        userId: request.context.userId,
        context: {
          currentPage: request.context.currentPage || '/enterprise',
          mode: request.context.mode || 'chat',
          workspaceId: request.context.workspaceId || 'default',
          routedAgentId: request.context.routedAgentId,
          routedAgentLabel: request.context.routedAgentName,
          projectId: request.context.projectId,
        },
      });

      return {
        provider: 'openclaw',
        content: response?.message?.content || 'No response returned.',
        actionId: `act_${Date.now()}`,
        projectId: request.context.projectId,
        metadata: response?.message?.metadata || {},
      };
    },
  };
}

export function createUnavailableAdapter(
  provider: 'perplexity' | 'openai' | 'anthropic'
): OrchestrationAdapter {
  return {
    provider,
    isAvailable: () => false,
    execute: async (): Promise<OrchestrationResponse> => {
      throw new Error(`${provider} adapter is not yet configured`);
    },
  };
}
