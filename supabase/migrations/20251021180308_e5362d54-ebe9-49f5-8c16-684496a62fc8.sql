-- Add DELETE policy for transactions table
-- This allows users to delete their own transactions when deleting tickets

CREATE POLICY "Users can delete their own transactions"
ON transactions
FOR DELETE
USING (auth.uid() = user_id);