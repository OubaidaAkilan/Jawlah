export declare function generateConfirmationLink(studentId: string, date: string, adminText: string): Promise<string>;
export declare function lookupConfirmationToken(token: string): Promise<{
    studentId: string;
    date: string;
    adminText: string;
} | null>;
