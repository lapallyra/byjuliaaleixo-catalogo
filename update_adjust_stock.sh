#!/bin/bash
sed -i 's/export const adjustStockForOrderItems = async (orderId: string, orderCode: string, oldItems: CartItem\[\], newItems: CartItem\[\]) => {/import { runTransaction } from "firebase\/firestore";\nexport const adjustStockForOrderItems = async (orderId: string, orderCode: string, oldItems: CartItem\[\], newItems: CartItem\[\]) => {/g' src/services/firebaseService.ts
