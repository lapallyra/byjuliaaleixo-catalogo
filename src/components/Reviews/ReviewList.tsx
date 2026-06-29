import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Review } from '../../types';
import { Star } from 'lucide-react';

interface Props {
  productId: string;
}

export const ReviewList: React.FC<Props> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Review));
      setReviews(data);
    });

    return () => unsubscribe();
  }, [productId]);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Avaliações</h3>
      {reviews.length === 0 ? (
        <p className="text-sm text-neutral-500">Nenhuma avaliação ainda.</p>
      ) : (
        reviews.map(review => (
          <div key={review.id} className="border-b pb-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-neutral-300"} />
              ))}
              <span className="text-xs font-semibold ml-2">{review.userName}</span>
            </div>
            <p className="text-sm mt-1">{review.comment}</p>
            {review.adminReply && (
              <div className="bg-neutral-100 p-2 rounded mt-2 text-xs">
                <span className="font-bold">Resposta da CEO  BILIONÁRIA:</span> {review.adminReply}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
