
export interface ProductCursor {
    createdAt: string;
    id: string
}


export function encodeCursor(c: ProductCursor): string {
    return Buffer.from(JSON.stringify(c), "utf-8").toString("base64url")
}


export function decodeCursor(token: string): ProductCursor | null {
    try {
        const json = Buffer.from(token, "base64url").toString("utf-8")
        const parsed = JSON.parse(json)
        if (
            typeof parsed?.createdAt === "string" &&
            typeof parsed?.id === "string"
        ) {
            return parsed as ProductCursor
        }
        return null
    } catch {
        return null
    }
}