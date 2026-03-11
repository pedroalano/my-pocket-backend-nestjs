import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Short-lived JWT access token (15 minutes)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  access_token: string;

  @ApiProperty({
    description:
      'Long-lived refresh token (7 days), used to obtain new access tokens',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refreshTokenPayload.signature',
  })
  refresh_token: string;
}
