
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceMessageProps {
  onSendVoiceMessage: (audioBlob: Blob) => void;
}

export const VoiceMessage = ({ onSendVoiceMessage }: VoiceMessageProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioBlob && !isPlaying) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      onSendVoiceMessage(audioBlob);
      setAudioBlob(null);
      toast({
        title: "ভয়েস মেসেজ পাঠানো হয়েছে",
        description: "আপনার ভয়েস মেসেজ সফলভাবে পাঠানো হয়েছে।"
      });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {!audioBlob ? (
        <Button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          className="rounded-full"
        >
          {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
        </Button>
      ) : (
        <div className="flex items-center space-x-2">
          <Button onClick={playAudio} variant="outline" size="icon" className="rounded-full">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button onClick={sendVoiceMessage} className="bg-purple-500 hover:bg-purple-600">
            পাঠান
          </Button>
          <Button onClick={() => setAudioBlob(null)} variant="outline">
            বাতিল
          </Button>
        </div>
      )}
    </div>
  );
};
