import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';
import { Label } from '@/lib/ui/label';
import { Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { uploadImageToCloudinary } from '@/src/lib/cloudinary';
import { toast } from 'sonner';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  newQuestion: { text: string; options: string[]; correctOptionIndex: number; topic: string; imageUrl?: string };
  setNewQuestion: (val: any) => void;
  handleAddQuestion: (e: React.FormEvent) => void;
}

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  newQuestion,
  setNewQuestion,
  handleAddQuestion,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setNewQuestion({ ...newQuestion, imageUrl });
      toast.success('Question image uploaded successfully');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Failed to upload question image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setNewQuestion({ ...newQuestion, imageUrl: '' });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6 text-base overflow-hidden">
      <div className="cbt-background" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-white rounded-[40px] shadow-2xl p-8 border border-primary/5 overflow-hidden relative z-10 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-black text-primary mb-6 text-center tracking-tighter uppercase">Add Question</h3>
        <form onSubmit={handleAddQuestion} className="space-y-4 font-medium">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Question Text</Label>
            <textarea
              value={newQuestion.text}
              onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
              placeholder="Enter question statement..."
              required
              className="w-full h-24 px-6 py-4 rounded-2xl bg-slate-50 border-2 border-primary/20 font-bold text-xs shadow-inner outline-none focus:border-primary focus:ring-0 resize-none transition-all"
            />
          </div>

          {/* Question Image Section */}
          <div className="space-y-2">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Question Image (Optional)</Label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {newQuestion.imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-primary/10 bg-slate-50 p-4 flex flex-col items-center justify-center group">
                <img
                  src={newQuestion.imageUrl}
                  alt="Question Diagram"
                  className="max-h-40 rounded-lg object-contain shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-black text-[10px] tracking-wider transition-all uppercase"
                >
                  <X className="w-3.5 h-3.5" /> Remove Image
                </button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                className="w-full h-14 rounded-2xl border-2 border-dashed border-primary/20 bg-slate-50 hover:bg-primary/5 font-black text-xs text-primary flex items-center justify-center gap-2 tracking-widest uppercase shadow-none transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Uploading to Cloudinary...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-primary" />
                    <span>Upload Question Image</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="space-y-1.5">
                <Label className="text-[10px] font-black text-primary/30 tracking-widest">Option {String.fromCharCode(65 + i)}</Label>
                <Input
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={newQuestion.options[i] || ''}
                  onChange={e => {
                    const opts = [...(newQuestion.options || ['', '', '', ''])];
                    opts[i] = e.target.value;
                    setNewQuestion({ ...newQuestion, options: opts });
                  }}
                  required
                  className="h-10 px-5 rounded-xl bg-slate-50 font-bold text-xs shadow-inner"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="w-full space-y-1.5">
              <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Correct Answer</Label>
              <select
                value={newQuestion.correctOptionIndex}
                onChange={e => setNewQuestion({ ...newQuestion, correctOptionIndex: parseInt(e.target.value) })}
                className="w-full h-10 px-5 rounded-xl bg-slate-50 border-2 border-primary/20 font-bold text-xs outline-none shadow-inner focus:border-primary transition-all"
              >
                <option value={0}>Answer: A</option>
                <option value={1}>Answer: B</option>
                <option value={2}>Answer: C</option>
                <option value={3}>Answer: D</option>
              </select>
            </div>
            <div className="w-full space-y-1.5">
              <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Topic Tag</Label>
              <Input
                placeholder="e.g. Algebra"
                value={newQuestion.topic}
                onChange={e => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                className="h-10 px-5 rounded-xl bg-slate-50 font-bold text-xs shadow-inner"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isUploading}
              className="flex-1 h-14 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all tracking-widest text-xs uppercase"
            >
              Commit Item
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="h-14 px-8 rounded-2xl font-black text-xs border-primary/10 uppercase"
            >
              Discard
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
