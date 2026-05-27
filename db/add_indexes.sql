-- Performance indexes — run this once in the Supabase SQL Editor
-- Go to: supabase.com → your project → SQL Editor → paste and run

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Messages (most queried table)
CREATE INDEX IF NOT EXISTS idx_messages_sender    ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv      ON messages(LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread    ON messages(recipient_id, is_read) WHERE is_read = false;

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_user       ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created    ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_tags_post   ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag    ON post_tags(tag_id);

-- Milestones
CREATE INDEX IF NOT EXISTS idx_milestones_user    ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_created ON milestones(user_id, created_at DESC);

-- Connections
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient ON connections(recipient_id);

-- Networks
CREATE INDEX IF NOT EXISTS idx_networks_creator    ON networks(creator_id);
CREATE INDEX IF NOT EXISTS idx_network_members_net ON network_members(network_id);
CREATE INDEX IF NOT EXISTS idx_network_members_usr ON network_members(user_id);

-- Roles
CREATE INDEX IF NOT EXISTS idx_network_roles_net         ON network_roles(network_id);
CREATE INDEX IF NOT EXISTS idx_network_member_roles_net  ON network_member_roles(network_id, user_id);

-- Channels
CREATE INDEX IF NOT EXISTS idx_network_channels_net   ON network_channels(network_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_chan  ON channel_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_messages_user  ON channel_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_perms_channel  ON channel_permission_overrides(channel_id);

-- User tags
CREATE INDEX IF NOT EXISTS idx_user_tags_user ON user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag  ON user_tags(tag_id);
