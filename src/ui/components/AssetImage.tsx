import { useState, type ImgHTMLAttributes } from 'react'
import { resolveAsset } from '../../assets/assetRegistry'

type AssetImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  assetId: string
  alt?: string
}

export function AssetImage({ assetId, alt, className = '', ...props }: AssetImageProps) {
  const asset = resolveAsset(assetId)
  const [loaded, setLoaded] = useState({ assetId, path: asset.path })
  const source = loaded.assetId === assetId ? loaded.path : asset.path

  return (
    <img
      {...props}
      src={source}
      alt={alt ?? asset.alt}
      className={`asset-image ${asset.pixelArt ? 'asset-image--pixel-art' : ''} ${className}`.trim()}
      onError={() => {
        if (source !== asset.fallback) setLoaded({ assetId, path: asset.fallback })
      }}
    />
  )
}
