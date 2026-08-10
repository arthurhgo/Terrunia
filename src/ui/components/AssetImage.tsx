import { useState, type ImgHTMLAttributes } from 'react'
import { resolveAsset } from '../../assets/assetRegistry'

type AssetImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  assetId: string
  alt?: string
}

export function AssetImage({ assetId, alt, className = '', ...props }: AssetImageProps) {
  const asset = resolveAsset(assetId)
  const [source, setSource] = useState(asset.path)

  return (
    <img
      {...props}
      src={source}
      alt={alt ?? asset.alt}
      className={`asset-image ${className}`}
      onError={() => {
        if (source !== asset.fallback) setSource(asset.fallback)
      }}
    />
  )
}
