# Korean social-image font

`signedprice-social-ko.ttf` is a renamed glyph subset of NanumGothic Bold,
distributed under the adjacent SIL Open Font License.

Source: https://github.com/google/fonts/blob/main/ofl/nanumgothic/NanumGothic-Bold.ttf
Source Git blob: `79a9bdc1fa190b5786b247bb5db6a00893e620fb`.

The subset includes the Korean social card copy and `signedprice` wordmark in
`lib/social-image.tsx`. Font naming records use SignedPrice Social to respect
the original reserved font names. When changing the card text, regenerate
the subset with FontTools or supply a compatible licensed font; the rendering
test rejects any external glyph download.
