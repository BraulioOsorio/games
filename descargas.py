import yt_dlp as youtube_dl
import os

def descargar_video_o_audio(url, salida, opcion):
    try:
        # Asegurarse de que la carpeta de salida existe
        if not os.path.exists(salida):
            os.makedirs(salida)
        
        if opcion == 'video':
            opciones = {
            'format': 'bestvideo+bestaudio/best',
            'outtmpl': os.path.join(salida, '%(title)s.%(ext)s'),
            'ffmpeg_location': 'C:\\ffmpeg\\bin\\ffmpeg.exe',
        }
        elif opcion == 'audio':
            opciones = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(salida, '%(title)s.%(ext)s'),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'ffmpeg_location': r'C:\ffmpeg\bin\ffmpeg.exe', 
            }

        with youtube_dl.YoutubeDL(opciones) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            title = info_dict.get('title', None)
            print(f"Descarga completada! Archivo guardado como {title}.{'mp4' if opcion == 'video' else 'mp3'} en {salida}")
    except Exception as e:
        print(f"Ha ocurrido un error: {e}")

# URL del video de YouTube
url_video = 'https://www.youtube.com/watch?v=YltqogcGeaU'  # Reemplaza 'ejemploID' con el ID del video real

# Carpeta de salida (usando cadena sin procesar)
carpeta_salida = r'C:\Users\usuario\Documents\Youtube'

# Opción para descargar ('video' o 'audio')
opcion_descarga = 'audio'  # Cambia a 'video' si deseas descargar el video completo

# Descargar el video o audio según la opción seleccionada
descargar_video_o_audio(url_video, carpeta_salida, opcion_descarga)
