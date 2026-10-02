<?php

namespace App\Models;

use Database\Factories\ContactMessageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A message sent through the contact form.
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property 'hiring'|'project' $reason
 * @property string|null $company
 * @property string $message
 * @property string|null $ip
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'reason', 'company', 'message', 'ip'])]
class ContactMessage extends Model
{
    /** @use HasFactory<ContactMessageFactory> */
    use HasFactory;

    public function reasonLabel(): string
    {
        return $this->reason === 'hiring' ? 'Hiring for a role' : 'Project enquiry';
    }

    public function firstName(): string
    {
        return strtok($this->name, ' ') ?: $this->name;
    }
}
