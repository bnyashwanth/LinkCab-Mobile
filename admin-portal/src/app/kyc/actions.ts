"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function approveKYC(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        kyc_status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error approving KYC:', error);
      return { success: false, error: error.message };
    }

    // Revalidate the KYC page to refresh the data
    revalidatePath('/kyc');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error approving KYC:', error);
    return { success: false, error: 'Failed to approve KYC' };
  }
}

export async function rejectKYC(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        kyc_status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error rejecting KYC:', error);
      return { success: false, error: error.message };
    }

    // Revalidate the KYC page to refresh the data
    revalidatePath('/kyc');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error rejecting KYC:', error);
    return { success: false, error: 'Failed to reject KYC' };
  }
}
