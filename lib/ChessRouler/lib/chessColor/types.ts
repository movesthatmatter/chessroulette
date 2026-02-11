export type WhiteShortColor = 'w';
export type BlackShortColor = 'b';
export type ShortChessColor = WhiteShortColor | BlackShortColor;

export type WhiteLongColor = 'white';
export type BlackLongColor = 'black';
export type LongChessColor = WhiteLongColor | BlackLongColor;

// WhiteChessColor & BlackChessColor is just an alias for the ShortChessColors
export type WhiteColor = WhiteShortColor;
export type BlackColor = BlackShortColor;

// ChessColor is just an alias for ShortChessColor
export type ChessColor = WhiteColor | BlackColor;
