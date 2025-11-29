import { Campaign } from "../types";
import { blobUrlToBase64 } from "./db";

export const prepareCampaignForExport = async (campaign: Campaign): Promise<Campaign & { _n8n_context?: any }> => {
    // Deep clone to safely mutate
    const exportCampaign = JSON.parse(JSON.stringify(campaign));
    
    // Ensure all video Blob URLs are converted to Base64
    for (const post of exportCampaign.data.posts) {
        for (const variantKey of ['A', 'B'] as const) {
             // @ts-ignore
            const variant = post.variants[variantKey];
            if (variant.videoUrl && variant.videoUrl.startsWith('blob:')) {
                variant.videoUrl = await blobUrlToBase64(variant.videoUrl);
            }
        }
    }

    // Add n8n Context
    exportCampaign._n8n_context = {
        info: "Import this JSON into n8n using a Webhook node (JSON body).",
        workflow_hint: "Iterate over 'data.posts' to access generated content for each platform.",
        generated_at: new Date().toISOString(),
        app_version: "Mind2Matter_v1"
    };

    return exportCampaign;
};

export const exportCampaignToJSON = async (campaign: Campaign) => {
  const readyCampaign = await prepareCampaignForExport(campaign);
  const jsonString = JSON.stringify(readyCampaign, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mind2matter-${readyCampaign.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportCampaignToCSV = (campaign: Campaign) => {
  const headers = [
      'Platform', 
      'Variant', 
      'Status', 
      'Scheduled Date', 
      'Content', 
      'Image Prompt', 
      'Image URL',
      'Likes Prediction', 
      'Shares Prediction', 
      'Comments Prediction', 
      'Reach Prediction'
  ];
  
  const rows: string[] = [];
  
  campaign.data.posts.forEach(post => {
    if (!campaign.data.selectedPlatforms.includes(post.platform)) return;
    
    ['A', 'B'].forEach(variantKey => {
      // @ts-ignore
      const v = post.variants[variantKey as 'A' | 'B'];
      const row = [
        post.platform,
        `Option ${variantKey}`,
        post.status,
        post.scheduledDate || '',
        `"${(v.content || '').replace(/"/g, '""')}"`, // Escape quotes for CSV
        `"${(v.imagePrompt || '').replace(/"/g, '""')}"`,
        v.imageUrl ? `"${v.imageUrl.substring(0, 50)}..."` : '', // Truncate base64 in CSV to keep it readable-ish
        v.analytics.likes,
        v.analytics.shares,
        v.analytics.comments,
        v.analytics.reach
      ];
      rows.push(row.join(','));
    });
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mind2matter-${campaign.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};