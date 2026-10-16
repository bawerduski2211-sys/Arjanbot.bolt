'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Play } from 'lucide-react';

export function DemoModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="glass gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black">
          <Play className="h-4 w-4" />
          Watch Demo
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong max-w-3xl overflow-hidden p-0 sm:rounded-2xl bg-black/80 backdrop-blur-md">
        <div className="relative aspect-video w-full bg-black">
          {open && (
            <video
              className="h-full w-full object-cover [::-webkit-media-controls-panel:min-h-[44px]] [video::-webkit-media-controls-play-button:min-w-[44px]_min-h-[44px]] [video::-webkit-media-controls-volume-slider-container:min-w-[44px]_min-h-[44px]] [video::-webkit-media-controls-fullscreen-button:min-w-[44px]_min-h-[44px]]"
              controls
              autoPlay
              poster="https://images.pexels.com/photos/27141316/pexels-photo-27141316.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            >
              <source
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
        <div className="border-t border-border/40 p-4">
          <p className="text-sm text-slate-100">
            A quick walkthrough of creating a bot, connecting it to WhatsApp,
            and watching live messages flow through the AI pipeline.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
