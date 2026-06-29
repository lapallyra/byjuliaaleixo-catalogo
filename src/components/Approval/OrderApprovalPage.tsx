import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, orderBy, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderVersion, OrderApprovalStatus } from '../../types';
import { Loader2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../services/firebaseService';

export const OrderApprovalPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [versions, setVersions] = useState<OrderVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentComment, setAdjustmentComment] = useState('');

  useEffect(() => {
    if (!code) return;

    const fetchOrder = async () => {
      try {
        const q = query(collection(db, 'sales'), where('code', '==', code.toUpperCase()));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setError('Pedido não encontrado.');
          return;
        }
        const orderDoc = querySnapshot.docs[0];
        const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;
        setOrder(orderData);

        const versionsQ = query(collection(db, 'sales', orderDoc.id, 'versions'), orderBy('version', 'desc'));
        const versionsSnapshot = await getDocs(versionsQ);
        const versionsData = versionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderVersion));
        setVersions(versionsData);
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'sales');
        setError('Erro ao carregar pedido.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [code]);

  const handleApprove = async () => {
    if (!order) return;
    try {
      await updateDoc(doc(db, 'sales', order.id), { approvalStatus: 'approved', status: 'waiting_payment' });
      setOrder({ ...order, approvalStatus: 'approved', status: 'waiting_payment' });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `sales/${order.id}`);
    }
  };

  const handleRequestAdjustment = async () => {
    if (!order) return;
    try {
      const nextVersion = (order.currentVersion || 1) + 1;
      await addDoc(collection(db, 'sales', order.id, 'versions'), {
        orderId: order.id,
        version: nextVersion,
        data: order,
        comment: adjustmentComment,
        author: 'customer',
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'sales', order.id), { 
        approvalStatus: 'adjustments_requested',
        currentVersion: nextVersion 
      });
      setOrder({ ...order, approvalStatus: 'adjustments_requested', currentVersion: nextVersion });
      setIsAdjusting(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `sales/${order.id}/versions`);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (error) return <div className="text-red-500 p-20 text-center">{error}</div>;
  if (!order) return <div className="p-20 text-center">Pedido não encontrado.</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="bg-white p-6 rounded-3xl border border-[#E5E5EA] shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1C1C1E] tracking-tight">Pedido #{order.code}</h1>
            <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">{order.customerName}</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${order.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {order.approvalStatus || 'Pendente'}
          </div>
        </header>
        
        {order.approvalStatus !== 'approved' && (
          <div className="flex gap-4">
            <button onClick={handleApprove} className="flex-1 bg-[#1C1C1E] text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">Aprovar Pedido</button>
            <button onClick={() => setIsAdjusting(true)} className="flex-1 bg-white border border-[#1C1C1E] text-[#1C1C1E] py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">Solicitar Ajustes</button>
          </div>
        )}

        {isAdjusting && (
          <div className="bg-white p-6 rounded-3xl border border-[#E5E5EA] shadow-xs space-y-4">
            <textarea value={adjustmentComment} onChange={(e) => setAdjustmentComment(e.target.value)} className="w-full p-4 border rounded-xl" placeholder="Descreva os ajustes necessários..." />
            <div className="flex gap-4">
              <button onClick={handleRequestAdjustment} className="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold">Enviar</button>
              <button onClick={() => setIsAdjusting(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-xl font-bold">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
