
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration, Tool } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Platform, Tone, ImageStyle, GeneratedPost, BrandVoice } from '../types';

interface ChatWidgetProps {
  appState: {
    idea: string;
    tone: Tone;
    imageStyle: ImageStyle;
    brandVoice: BrandVoice;
    posts: GeneratedPost[];
    selectedPlatforms: Platform[];
  };
  actions: {
    setIdea: (idea: string) => void;
    setTone: (tone: Tone) => void;
    setImageStyle: (style: ImageStyle) => void;
    togglePlatform: (platform: Platform) => void;
    generateContent: () => Promise<void>;
    editPostContent: (platform: Platform, content: string) => void;
    generateImage: (platform: Platform, prompt: string) => Promise<void>;
    editImage: (platform: Platform, instruction: string) => Promise<void>;
    generateVideo: (platform: Platform) => Promise<void>;
    saveCampaign: () => void;
    loadCampaign: (id: string) => void;
  };
}

interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
  image?: string;
  isTool?: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ appState, actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm your Mind 2 Matter creative partner. I can help you brainstorm ideas and control the app to generate content. How can we start?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize GenAI
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // --- TOOL DEFINITIONS ---
  const tools: Tool[] = [
    // googleSearch removed to avoid "Tool use with function calling is unsupported" error
    {
      functionDeclarations: [
        {
          name: "update_campaign_settings",
          description: "Update the campaign topic (idea), tone, or visual style.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              idea: { type: Type.STRING, description: "The topic or idea for the posts" },
              tone: { type: Type.STRING, description: `The tone: ${Object.values(Tone).join(", ")}` },
              imageStyle: { type: Type.STRING, description: `The image style: ${Object.values(ImageStyle).join(", ")}` }
            }
          }
        },
        {
          name: "get_app_state",
          description: "Get the current state of the app including campaign settings, selected platforms, and generated content status.",
          parameters: { type: Type.OBJECT, properties: {} }
        },
        {
          name: "trigger_content_generation",
          description: "Start the generation process for all selected platforms.",
          parameters: { type: Type.OBJECT, properties: {} }
        },
        {
            name: "edit_post_text",
            description: "Update the text content for a specific platform.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    platform: { type: Type.STRING, description: "The platform name (e.g. LinkedIn, Twitter)" },
                    new_content: { type: Type.STRING, description: "The new text content" }
                },
                required: ["platform", "new_content"]
            }
        },
        {
            name: "edit_post_image",
            description: "Edit the generated image for a platform using a text instruction.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    platform: { type: Type.STRING, description: "The platform name" },
                    instruction: { type: Type.STRING, description: "What to change in the image" }
                },
                required: ["platform", "instruction"]
            }
        },
        {
            name: "generate_platform_video",
            description: "Generate a video for a specific platform.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    platform: { type: Type.STRING, description: "The platform name" }
                },
                required: ["platform"]
            }
        },
        {
            name: "save_campaign",
            description: "Save the current campaign state to history.",
            parameters: { type: Type.OBJECT, properties: {} }
        }
      ]
    }
  ];

  const chatSessionRef = useRef<any>(null);

  // Initialize Chat Session
  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = ai.chats.create({
        model: "gemini-3-pro-preview",
        config: {
          systemInstruction: `You are a collaborative AI marketing agent embedded in the Mind 2 Matter app.
          
          Your capabilities:
          1. Brainstorm creative ideas and strategies.
          2. Control the app: You can update settings, trigger generation, and edit results directly via tools.
          3. Analyze images: If the user uploads an image, analyze it for social media potential.
          4. Manage Campaigns: You can save the current work.
          
          Tools Usage Guidelines:
          - Use 'get_app_state' to understand the current context (idea, tone, selected platforms, generated content) before making suggestions or when the user asks for a status update.
          - Use 'update_campaign_settings' to change the topic, tone, or style.
          - Use 'trigger_content_generation' to generate posts.
          - Use 'edit_post_text' or 'edit_post_image' to refine specific outputs.
          - Use 'save_campaign' when the user wants to save their work.
          
          When asked to generate content:
          1. Ensure the 'idea' and 'tone' are set (ask the user or infer).
          2. Call 'trigger_content_generation'.
          
          Always be helpful, professional, and proactive. If you perform an action on the app, confirm it to the user.
          Thinking Budget: 32768. Use thinking for complex reasoning.
          `,
          tools: tools,
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });
    }
  }, []);

  // --- MESSAGE HANDLING ---

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage) || isLoading) return;

    const userText = inputValue;
    const imageToSend = selectedImage;
    
    setInputValue("");
    setSelectedImage(null);
    setMessages(prev => [...prev, { role: 'user', text: userText, image: imageToSend || undefined }]);
    setIsLoading(true);

    try {
      // Construct message parts
      const parts: any[] = [];
      if (imageToSend) {
         const match = imageToSend.match(/^data:(.+);base64,(.+)$/);
         if (match) {
             parts.push({
                 inlineData: { mimeType: match[1], data: match[2] }
             });
         }
      }
      if (userText) {
          parts.push({ text: userText });
      }

      // FIX: Pass as { message: parts } to satisfy ContentUnion
      let response = await chatSessionRef.current.sendMessage({ message: parts });
      
      // Loop for tool calls
      while (response.functionCalls && response.functionCalls.length > 0) {
          const toolResponses = [];
          
          for (const call of response.functionCalls) {
              let result = { result: "Success" };
              
              // --- TOOL EXECUTION LOGIC ---
              try {
                  if (call.name === "update_campaign_settings") {
                      const { idea, tone, imageStyle } = call.args as any;
                      if (idea) actions.setIdea(idea);
                      
                      if (tone) {
                         // Case-insensitive match for Tone enum
                         const matchedTone = Object.values(Tone).find(t => t.toLowerCase() === tone.toLowerCase());
                         if (matchedTone) actions.setTone(matchedTone);
                         else actions.setTone(tone as Tone); // Fallback
                      }

                      if (imageStyle) {
                         // Case-insensitive match for ImageStyle enum
                         const matchedStyle = Object.values(ImageStyle).find(s => s.toLowerCase() === imageStyle.toLowerCase());
                         if (matchedStyle) actions.setImageStyle(matchedStyle);
                         else actions.setImageStyle(imageStyle as ImageStyle); // Fallback
                      }

                      result = { result: `Settings updated: Idea=${idea || 'unchanged'}, Tone=${tone || 'unchanged'}` };
                  } 
                  else if (call.name === "get_app_state") {
                      const stateSummary = {
                          settings: {
                              idea: appState.idea,
                              tone: appState.tone,
                              imageStyle: appState.imageStyle,
                              brandVoice: appState.brandVoice,
                              selectedPlatforms: appState.selectedPlatforms
                          },
                          generatedContent: appState.posts.map(p => ({
                              platform: p.platform,
                              isSelected: appState.selectedPlatforms.includes(p.platform),
                              currentVariant: p.selectedVariantId,
                              contentPreview: p.variants[p.selectedVariantId].content ? p.variants[p.selectedVariantId].content?.substring(0, 50) + "..." : "Not generated",
                              hasImage: !!p.variants[p.selectedVariantId].imageUrl,
                              hasVideo: !!p.variants[p.selectedVariantId].videoUrl,
                              status: p.status
                          }))
                      };
                      result = { result: JSON.stringify(stateSummary) };
                  }
                  else if (call.name === "trigger_content_generation") {
                      actions.generateContent(); // Async but fire and forget for the tool loop
                      result = { result: "Generation started. Tell user to watch the dashboard." };
                  }
                  else if (call.name === "edit_post_text") {
                      const { platform, new_content } = call.args as any;
                      const pEnum = Object.values(Platform).find(p => p.toLowerCase() === platform.toLowerCase());
                      if (pEnum) {
                          actions.editPostContent(pEnum, new_content);
                          result = { result: `Updated text for ${pEnum}` };
                      } else {
                          result = { result: `Platform ${platform} not found.` };
                      }
                  }
                  else if (call.name === "edit_post_image") {
                      const { platform, instruction } = call.args as any;
                      const pEnum = Object.values(Platform).find(p => p.toLowerCase() === platform.toLowerCase());
                      if (pEnum) {
                          await actions.editImage(pEnum, instruction);
                          result = { result: `Image edit initiated for ${pEnum}` };
                      } else {
                          result = { result: "Platform not found" };
                      }
                  }
                   else if (call.name === "generate_platform_video") {
                      const { platform } = call.args as any;
                      const pEnum = Object.values(Platform).find(p => p.toLowerCase() === platform.toLowerCase());
                      if (pEnum) {
                          await actions.generateVideo(pEnum);
                          result = { result: `Video generation started for ${pEnum}` };
                      } else {
                           result = { result: "Platform not found" };
                      }
                  }
                  else if (call.name === "save_campaign") {
                    actions.saveCampaign();
                    result = { result: "Campaign saved to history." };
                  }
              } catch (e: any) {
                  result = { result: `Error executing tool: ${e.message}` };
              }

              toolResponses.push({
                  functionResponse: {
                      name: call.name,
                      id: call.id,
                      response: result
                  }
              });
          }
          
          // Send tool responses back to model wrapped in { message: ... }
          response = await chatSessionRef.current.sendMessage({ message: toolResponses });
      }

      // Final text response
      const modelText = response.text;
      if (modelText) {
          setMessages(prev => [...prev, { role: 'model', text: modelText }]);
      }
      
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'system', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
          {/* Header */}
          <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-sm">Mind 2 Matter AI</h3>
                <p className="text-[10px] text-indigo-200">Powered by Gemini 3 Pro</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : msg.role === 'system'
                    ? 'bg-red-100 text-red-600 w-full text-center'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                }`}>
                  {msg.image && (
                      <img src={msg.image} alt="Uploaded" className="max-w-full h-32 object-cover rounded-lg mb-2 border border-white/20" />
                  )}
                  {msg.role === 'model' ? (
                      <div className="prose prose-sm max-w-none prose-p:leading-tight prose-a:text-indigo-600 prose-ul:pl-4">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                  ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            {selectedImage && (
                <div className="mb-2 flex items-center gap-2 bg-slate-100 p-2 rounded-lg">
                    <img src={selectedImage} alt="Preview" className="w-8 h-8 object-cover rounded" />
                    <span className="text-xs text-slate-500 flex-1 truncate">Image attached</span>
                    <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
            <div className="flex items-center gap-2">
              <label className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full cursor-pointer transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 bg-slate-50 border-none rounded-full py-2 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 text-slate-700 placeholder:text-slate-400"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() && !selectedImage}
                className="p-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-[0_8px_30px_rgba(79,70,229,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {isOpen ? (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        ) : (
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>
    </div>
  );
};
