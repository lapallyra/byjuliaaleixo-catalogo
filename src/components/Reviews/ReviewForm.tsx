import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Star } from 'lucide-react';

interface Props {
  productId: string;
}

export const ReviewForm: React.FC<Props> = ({ productId }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return alert('Você precisa estar logado para avaliar.');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Cliente',
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      setComment('');
      alert('Avaliação enviada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-4 border-t pt-4">
      <h4 className="font-bold text-sm">Avaliar este produto</h4>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((r) => (
          <Star 
            key={r} 
            size={20} 
            className={r <= rating ? "text-yellow-400 fill-yellow-400 cursor-pointer" : "text-neutral-300 cursor-pointer"}
            onClick={() => setRating(r)}
          />
        ))}
      </div>
      <textarea 
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="O que achou do produto?"
        className="w-full text-sm p-2 border rounded"
        maxLength={1000}
      />
      <button 
        disabled={loading}
        className="text-xs bg-[#cca062] text-white px-4 py-2 rounded"
      >
        {loading ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
};
