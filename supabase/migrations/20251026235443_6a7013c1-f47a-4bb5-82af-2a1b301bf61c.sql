-- Clean up old portfolio files that are causing CSP errors
DELETE FROM profile_portfolio 
WHERE id IN ('ac4ef9e1-4716-412d-8bbf-0b5031a705f0', '06a405a1-6d25-4230-9cf2-fe14c9db5984');