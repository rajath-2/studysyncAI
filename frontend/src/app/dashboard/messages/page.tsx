"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Send, Phone, Video, Search, Hash, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { messagesService, Message } from "@/services/messages";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { fetchAPI } from "@/lib/api";

interface Chat {
  id: string;
  name: string;
  subject: string;
  lastMessage: string;
  time: string;
  unread: number;
  members: number;
}

export default function MessagesPage() {
  const { token, user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const realtimeMessages = useRealtimeMessages(activeChat || "", messages);

  useEffect(() => {
    if (token) {
      loadChats();
    }
  }, [token]);

  useEffect(() => {
    if (activeChat && token) {
      loadMessages(activeChat);
    }
  }, [activeChat, token]);

  const loadChats = async () => {
    if (!token) return;
    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const actualToken = authData.state?.token || token;

      const data = await fetchAPI<{ groups: any[] }>('/groups/my', { token: actualToken });

      const chatList = (data.groups || []).map(group => ({
        id: group.id,
        name: group.name,
        subject: group.subject || '',
        lastMessage: '',
        time: '',
        unread: 0,
        members: group.member_count || 0,
      }));

      setChats(chatList);
      if (chatList.length > 0 && !activeChat) {
        setActiveChat(chatList[0].id);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
      // Keep empty if no groups
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (groupId: string) => {
    if (!token) return;
    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const actualToken = authData.state?.token || token;

      const data = await messagesService.getMessages(groupId, actualToken);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !token) return;

    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const actualToken = authData.state?.token || token;

      const message = await messagesService.sendMessage(activeChat, { content: newMessage }, actualToken);
      setMessages(prev => [message, ...prev]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar - Chat List */}
      <Card className="w-80 flex flex-col hidden md:flex border-border/50">
        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 bg-muted/50 border-none" placeholder="Search messages..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {chats.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground text-sm">
              <p>No groups yet.</p>
              <Button variant="link" className="mt-2" onClick={() => window.location.href = '/dashboard/groups'}>
                Create or join a group
              </Button>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={cn(
                  "w-full text-left flex items-start p-3 rounded-lg mb-1 transition-colors",
                  activeChat === chat.id ? "bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3 shrink-0">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={cn("text-sm font-medium truncate", activeChat === chat.id ? "text-primary" : "text-foreground")}>
                      {chat.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{chat.subject} • {chat.members} members</p>
                </div>
                {chat.unread > 0 && (
                  <div className="ml-2 bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shrink-0">
                    {chat.unread}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col border-border/50 overflow-hidden">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-muted/20">
              <div className="flex items-center">
                <Hash className="h-5 w-5 text-muted-foreground mr-2" />
                <h2 className="font-semibold">{chats.find(c => c.id === activeChat)?.name}</h2>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {[...realtimeMessages, ...messages].reverse().map((msg, idx) => {
                const isMe = msg.user_id === user?.id;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id || idx}
                    className={cn("flex max-w-[80%]", isMe ? "ml-auto justify-end" : "")}
                  >
                    {!isMe && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-3 shrink-0 text-xs font-bold mt-1">
                        {msg.user_name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                      <div className="flex items-baseline mb-1 space-x-2">
                        <span className="text-xs font-medium">{isMe ? "You" : msg.user_name}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm",
                        isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-muted/20 border-t border-border/50">
              <form className="flex space-x-2" onSubmit={handleSendMessage}>
                <Input
                  className="flex-1 bg-background"
                  placeholder={`Message...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {chats.length === 0 ? (
              <div className="text-center">
                <p>No groups yet.</p>
                <Button variant="link" className="mt-2" onClick={() => window.location.href = '/dashboard/groups'}>
                  Create or join a group
                </Button>
              </div>
            ) : (
              "Select a conversation to start messaging"
            )}
          </div>
        )}
      </Card>
    </div>
  );
}