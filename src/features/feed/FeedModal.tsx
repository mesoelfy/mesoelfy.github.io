import { ModalContainer } from '@/ui/overlays/ModalContainer';
import feed from '@/sys/config/static/feed.json';
import { ExternalLink } from 'lucide-react';

export const FeedModal = () => {
  return (
    <ModalContainer title="SYSTEM_LOGS // FEED" type="feed">
      <div className="space-y-6 font-mono">
        {feed.map((post) => (
          <div key={post.id} className="border-l-2 border-primary-green-dim pl-4 py-2 hover:bg-primary-green/5 transition-colors group">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-xs text-primary-green-dim bg-primary-green-dark/30 px-2 py-1 rounded">
                [{post.date}]
              </span>
              <h3 className="text-xl font-bold text-primary-green group-hover:text-alert-yellow transition-colors">
                {post.title}
              </h3>
            </div>
            
            <p className="text-primary-green-dim/80 mb-3 max-w-2xl">
              {post.desc}
            </p>

            <a 
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-latent-purple-light hover:text-primary-green underline decoration-latent-purple-dim decoration-dashed underline-offset-4"
            >
              <span>VIEW_SOURCE</span>
              <ExternalLink size={14} />
            </a>
          </div>
        ))}
        
        {/* End of Log Marker */}
        <div className="text-center py-8 text-primary-green-dim/30 animate-pulse">
          -- END OF STREAM --
        </div>
      </div>
    </ModalContainer>
  );
};
