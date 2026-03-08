import { supabase } from './supabase/client';
import {
  createSocialInvite,
  listSocialRelationships,
  transitionSocialRelationship,
  type SocialRelationshipType,
} from './social-relationships';

export type SocialType = 'friend' | 'teammate' | 'collaborative';
export type RelationshipStatus = 'pending' | 'accepted' | 'blocked';
export type RelationshipDirection = 'inbound' | 'outbound';
export type RelationshipAction = 'accept' | 'decline' | 'cancel' | 'revoke' | 'block' | 'unblock';

export interface SocialRelationshipRecord {
  relationshipId: string;
  relationshipType: SocialType;
  status: RelationshipStatus;
  direction: RelationshipDirection;
  partnerUserId: string;
  partnerEmail: string;
  partnerName: string;
  partnerAvatar: string;
  updatedAt: string;
}

export interface SocialChatMessage {
  messageId: string;
  relationshipType: SocialType;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
}

const LOCAL_MESSAGE_STORE_KEY = 'syncscript_social_messages_local_v1';

function isRpcUnavailable(error: any) {
  const code = String(error?.code || '');
  const message = String(error?.message || '').toLowerCase();
  return (
    code === 'PGRST202' ||
    message.includes('could not find the function') ||
    message.includes('does not exist') ||
    message.includes('relation') && message.includes('does not exist')
  );
}

async function getActorId() {
  try {
    const { data } = await supabase.auth.getUser();
    return String(data?.user?.id || 'guest-user');
  } catch {
    return 'guest-user';
  }
}

function toLocalType(type: SocialType): SocialRelationshipType {
  return type;
}

function readLocalMessages(): SocialChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_MESSAGE_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMessages(messages: SocialChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_MESSAGE_STORE_KEY, JSON.stringify(messages.slice(-2000)));
  } catch {
    // Best effort local persistence.
  }
}

function mapRelationship(row: any): SocialRelationshipRecord {
  return {
    relationshipId: String(row.relationship_id),
    relationshipType: row.relationship_type,
    status: row.status,
    direction: row.direction,
    partnerUserId: String(row.partner_user_id),
    partnerEmail: String(row.partner_email || ''),
    partnerName: String(row.partner_name || row.partner_email || 'User'),
    partnerAvatar: String(row.partner_avatar || ''),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

function mapMessage(row: any): SocialChatMessage {
  return {
    messageId: String(row.message_id),
    relationshipType: row.relationship_type,
    senderId: String(row.sender_id),
    recipientId: String(row.recipient_id),
    body: String(row.body || ''),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export async function listRelationships(type: SocialType): Promise<SocialRelationshipRecord[]> {
  const { data, error } = await supabase.rpc('social_list_relationships', {
    p_relationship_type: type,
  });
  if (error && !isRpcUnavailable(error)) throw error;
  if (error && isRpcUnavailable(error)) {
    const actorId = await getActorId();
    const local = listSocialRelationships(actorId, toLocalType(type));
    return local.map((item) => ({
      relationshipId: item.id,
      relationshipType: type,
      status: item.status === 'connected' ? 'accepted' : item.status === 'blocked' ? 'blocked' : 'pending',
      direction: item.status === 'pending_inbound' ? 'inbound' : 'outbound',
      partnerUserId: item.targetKey,
      partnerEmail: item.targetEmail || '',
      partnerName: item.targetLabel || item.targetKey,
      partnerAvatar: '',
      updatedAt: item.updatedAt,
    }));
  }
  return Array.isArray(data) ? data.map(mapRelationship) : [];
}

export async function inviteByEmail(type: SocialType, email: string): Promise<SocialRelationshipRecord> {
  const { data, error } = await supabase.rpc('social_invite', {
    p_relationship_type: type,
    p_target_email: email.trim(),
  });
  if (error && !isRpcUnavailable(error)) throw error;
  if (error && isRpcUnavailable(error)) {
    const actorId = await getActorId();
    const local = createSocialInvite({
      actorId,
      type: toLocalType(type),
      targetLabel: email.trim(),
      targetEmail: email.trim(),
    });
    if (!local.ok) throw new Error(local.message);
    return {
      relationshipId: local.record.id,
      relationshipType: type,
      status: local.record.status === 'blocked' ? 'blocked' : local.record.status === 'connected' ? 'accepted' : 'pending',
      direction: local.record.status === 'pending_inbound' ? 'inbound' : 'outbound',
      partnerUserId: local.record.targetKey,
      partnerEmail: local.record.targetEmail || email.trim(),
      partnerName: local.record.targetLabel || email.trim(),
      partnerAvatar: '',
      updatedAt: local.record.updatedAt,
    };
  }
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invite did not return a relationship record.');
  }
  return mapRelationship(data[0]);
}

export async function relationshipAction(
  relationshipId: string,
  action: RelationshipAction,
): Promise<SocialRelationshipRecord | null> {
  const { data, error } = await supabase.rpc('social_relationship_action', {
    p_relationship_id: relationshipId,
    p_action: action,
  });
  if (error && !isRpcUnavailable(error)) throw error;
  if (error && isRpcUnavailable(error)) {
    const localAction =
      action === 'accept' ? 'accept' :
      action === 'decline' ? 'decline' :
      action === 'cancel' ? 'cancel' :
      action === 'revoke' ? 'revoke' :
      action === 'block' ? 'block' : 'unblock';
    const local = transitionSocialRelationship(relationshipId, localAction);
    if (!local.ok) throw new Error(local.message);
    const actorId = await getActorId();
    const localList = listSocialRelationships(actorId, toLocalType(local.record.type as SocialType));
    const matched = localList.find((item) => item.id === relationshipId);
    if (!matched) return null;
    return {
      relationshipId: matched.id,
      relationshipType: matched.type as SocialType,
      status: matched.status === 'connected' ? 'accepted' : matched.status === 'blocked' ? 'blocked' : 'pending',
      direction: matched.status === 'pending_inbound' ? 'inbound' : 'outbound',
      partnerUserId: matched.targetKey,
      partnerEmail: matched.targetEmail || '',
      partnerName: matched.targetLabel || matched.targetKey,
      partnerAvatar: '',
      updatedAt: matched.updatedAt,
    };
  }
  if (!Array.isArray(data) || data.length === 0) return null;
  return mapRelationship(data[0]);
}

export async function listMessages(type: SocialType, partnerUserId: string): Promise<SocialChatMessage[]> {
  const { data, error } = await supabase.rpc('social_list_messages', {
    p_relationship_type: type,
    p_partner_user_id: partnerUserId,
    p_limit: 200,
  });
  if (error && !isRpcUnavailable(error)) throw error;
  if (error && isRpcUnavailable(error)) {
    const actorId = await getActorId();
    return readLocalMessages()
      .filter((msg) => {
        if (msg.relationshipType !== type) return false;
        const other = msg.senderId === actorId ? msg.recipientId : msg.senderId;
        return other === partnerUserId;
      })
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }
  return Array.isArray(data) ? data.map(mapMessage) : [];
}

export async function sendMessage(
  type: SocialType,
  partnerUserId: string,
  body: string,
): Promise<SocialChatMessage> {
  const { data, error } = await supabase.rpc('social_send_message', {
    p_relationship_type: type,
    p_partner_user_id: partnerUserId,
    p_body: body.trim(),
  });
  if (error && !isRpcUnavailable(error)) throw error;
  if (error && isRpcUnavailable(error)) {
    const actorId = await getActorId();
    const localMessage: SocialChatMessage = {
      messageId: `local-msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      relationshipType: type,
      senderId: actorId,
      recipientId: partnerUserId,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };
    const all = readLocalMessages();
    all.push(localMessage);
    writeLocalMessages(all);
    return localMessage;
  }
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Message send did not return a message record.');
  }
  return mapMessage(data[0]);
}

export function subscribeToSocialMessages(
  actorUserId: string,
  onMessage: (payload: SocialChatMessage) => void,
) {
  const channel = supabase
    .channel(`social_messages_${actorUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'social_messages',
      },
      (payload) => {
        const row: any = payload.new;
        if (!row) return;
        const senderId = String(row.sender_id || '');
        const recipientId = String(row.recipient_id || '');
        if (senderId !== actorUserId && recipientId !== actorUserId) return;
        onMessage({
          messageId: String(row.id),
          relationshipType: row.relationship_type,
          senderId,
          recipientId,
          body: String(row.body || ''),
          createdAt: String(row.created_at || new Date().toISOString()),
        });
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
