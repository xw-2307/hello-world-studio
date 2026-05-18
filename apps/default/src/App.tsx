import * as React from 'react';
import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { createConversation, createAgentChat } from '@/lib/agent-chat/v2';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';
import { isToolUIPart } from 'ai';
import type { UIMessage } from 'ai';
import { ulid } from 'ulidx';

const AGENT_ID = '01KRJZTADRQ11WGK6VNW1RBT20';

function MessageParts({
  message,
  onApprove,
}: {
  message: UIMessage;
  onApprove: ReturnType<typeof useChat>['addToolApprovalResponse'];
}) {
  return (
    <>
      {message.parts.map((part, i) => {
        const key = `${message.id}-${i}`;
        if (part.type === 'text') {
          return message.role === 'user' ? (
            <p key={key}>{part.text}</p>
          ) : (
            <MessageResponse key={key}>{part.text}</MessageResponse>
          );
        }
        if (isToolUIPart(part)) {
          return <div key={key} className="text-xs text-muted-foreground italic">Tool: {part.toolName}</div>;
        }
        return null;
      })}
    </>
  );
}

function ActiveChat({ chat }: { chat: ReturnType<typeof createAgentChat> }) {
  const { messages, status, addToolApprovalResponse } = useChat({ chat, id: chat.id });

  const handleSend = async (text: string) => {
    await chat.sendMessage({
      id: ulid(),
      role: 'user',
      parts: [{ type: 'text', text }],
    });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      <Conversation>
        <ConversationContent>
          {messages.map((msg) => (
            <Message key={msg.id} from={msg.role}>
              <MessageContent>
                <MessageParts message={msg} onApprove={addToolApprovalResponse} />
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {!hasMessages && (
        <Suggestions>
          <Suggestion suggestion="Say hello to me!" onClick={handleSend} />
          <Suggestion suggestion="What is this app?" onClick={handleSend} />
          <Suggestion suggestion="Tell me a fun fact!" onClick={handleSend} />
        </Suggestions>
      )}

      <PromptInput onSubmit={({ text }) => handleSend(text)}>
        <PromptInputTextarea placeholder="Say something…" />
        <PromptInputFooter>
          <PromptInputSubmit status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function ChatPanel() {
  const [chat, setChat] = useState<ReturnType<typeof createAgentChat> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { conversationId } = await createConversation(AGENT_ID);
        setChat(createAgentChat(AGENT_ID, conversationId));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm animate-pulse">
        Waking up your assistant…
      </div>
    );
  }

  if (!chat) return null;
  return <ActiveChat chat={chat} />;
}

const App: React.FC = function () {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-6 mb-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-5xl animate-bounce">👋</div>
          <h1 className="text-4xl font-bold tracking-tight">Hello, World!</h1>
          <p className="text-muted-foreground text-lg max-w-sm">
            A simple, living app powered by{' '}
            <span className="text-primary font-semibold">Taskade Genesis</span>.
            Chat with the assistant below.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          {['Project ✓', 'Agent ✓', 'Interface ✓'].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs rounded-full border border-border bg-muted text-muted-foreground font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
        style={{ height: '480px', display: 'flex', flexDirection: 'column' }}
      >
        <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">Hello World Assistant</span>
        </div>
        <div className="flex-1 min-h-0">
          <ChatPanel />
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Built with Taskade Genesis · {new Date().getFullYear()}
      </p>
    </div>
  );
};

export default App;
