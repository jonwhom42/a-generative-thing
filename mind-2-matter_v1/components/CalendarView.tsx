
import React, { useState } from "react";
import { GeneratedPost, Platform } from "../types";

interface CalendarViewProps {
  posts: GeneratedPost[];
}

const PlatformColors: Record<Platform, string> = {
  [Platform.LINKEDIN]: "bg-blue-600",
  [Platform.TWITTER]: "bg-black",
  [Platform.INSTAGRAM]: "bg-pink-600",
  [Platform.TIKTOK]: "bg-teal-500",
  [Platform.FACEBOOK]: "bg-blue-700",
};

export const CalendarView: React.FC<CalendarViewProps> = ({ posts }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthName = today.toLocaleString("default", { month: "long" });

  // Filter only scheduled posts
  const scheduledPosts = posts.filter((p) => p.scheduledDate);
  const scheduledCount = scheduledPosts.length;

  // Get next upcoming post for summary
  const nextPost = scheduledPosts
    .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
    .find(p => new Date(p.scheduledDate!) > new Date());

  const getPostsForDay = (day: number) => {
    return scheduledPosts.filter((post) => {
      if (!post.scheduledDate) return false;
      const date = new Date(post.scheduledDate);
      return (
        date.getDate() === day &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });
  };

  // Helper for unique platform icons in summary
  const scheduledPlatforms = Array.from(new Set(scheduledPosts.map(p => p.platform))) as Platform[];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md">
      {/* Header / Summary Row - Always Visible & Clickable */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors group select-none"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-colors ${scheduledCount > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Content Calendar</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-sm font-medium text-slate-500">
                 {scheduledCount > 0 
                   ? `${scheduledCount} post${scheduledCount !== 1 ? 's' : ''} scheduled for ${monthName}`
                   : `No posts scheduled for ${monthName}`
                 }
               </span>
               {/* Platform Dots Summary */}
               {scheduledCount > 0 && (
                 <div className="flex -space-x-1 ml-2">
                    {scheduledPlatforms.map(p => (
                      <div key={p} className={`w-2.5 h-2.5 rounded-full ring-2 ring-white ${PlatformColors[p]}`} />
                    ))}
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           {/* Next Up Info (Visible on Desktop when collapsed) */}
           {nextPost && !isExpanded && (
             <div className="hidden md:flex flex-col items-end mr-2 animate-in fade-in duration-500">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Next Up</span>
                <div className="flex items-center gap-2">
                   <span className={`w-2 h-2 rounded-full ${PlatformColors[nextPost.platform]}`}></span>
                   <span className="text-sm font-bold text-slate-700">
                     {new Date(nextPost.scheduledDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                   </span>
                   <span className="text-xs text-slate-500">
                     {new Date(nextPost.scheduledDate!).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                   </span>
                </div>
             </div>
           )}

           {/* Expand/Collapse Chevron */}
           <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 transition-all duration-300 ${isExpanded ? 'bg-indigo-50 border-indigo-100 text-indigo-600 rotate-180' : 'bg-white group-hover:border-indigo-200 group-hover:text-indigo-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
           </div>
        </div>
      </div>

      {/* Expandable Content - The Actual Calendar Grid */}
      <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${isExpanded ? 'grid-rows-[1fr] border-t border-slate-100' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
           <div className="p-6 pt-2">
              {/* Month Navigation / Title within expanded view */}
              <div className="flex items-center justify-end mb-4">
                 <span className="text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                    {monthName} {currentYear}
                 </span>
              </div>

              <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Day Headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="bg-slate-50 p-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}

                {/* Empty Days from previous month */}
                {blanks.map((blank) => (
                  <div key={`blank-${blank}`} className="bg-white/50 h-28"></div>
                ))}

                {/* Days of Month */}
                {days.map((day) => {
                  const dayPosts = getPostsForDay(day);
                  const isToday = day === today.getDate();
                  
                  return (
                    <div key={day} className={`bg-white h-28 p-2 hover:bg-slate-50/80 transition-colors relative group flex flex-col ${isToday ? 'bg-indigo-50/30' : ''}`}>
                      <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-700'}`}>
                        {day}
                      </span>
                      
                      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                        {dayPosts.map((post, idx) => {
                          const date = new Date(post.scheduledDate!);
                          const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                          return (
                            <div
                              key={`${post.platform}-${idx}`}
                              className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group/item"
                              title={`${post.platform}: ${time}`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PlatformColors[post.platform]}`} />
                              <span className="text-[10px] truncate text-slate-600 font-medium leading-tight group-hover/item:text-indigo-700">
                                {time}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
